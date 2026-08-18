import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from './components/Layout';
import PassportCard from './components/PassportCard';
import PassportBook from './components/PassportBook';
import StampReveal from './components/StampReveal';
import FlightBoard from './components/FlightBoard';
import SplashScreen from './components/SplashScreen';
import PassportCelebration from './components/PassportCelebration';
import AnnouncementBanner from './components/AnnouncementBanner'
import TravelerNav from './components/TravelerNav'
import CommandCenter from './components/CommandCenter'
import TowerScreen from './components/TowerScreen'
import MimouPage from './components/MimouPage'
import Countdown from './components/Countdown';
import Toast from './components/Toast';
import { GROUPS } from './data/groups';
import { PRELOADED_GUESTS } from './data/guests';
import { MISSIONS } from './data/missions';
import { PASSPORT_DESTINATIONS } from './data/destinations';
import { CONFIG } from './lib/config';
import {
  readLocal,
  writeLocal,
  clearLocal,
  readPendingResponses,
  writePendingResponses,
} from './lib/storage';
import { randomCooldownSeconds } from './lib/time';
import { playStampSound, unlockSound } from './lib/sound';
import { selectMission } from './lib/missionEngine';
import { supabase, supabaseEnabled } from './lib/supabase';

const INITIAL_JOURNAL = [
  {
    id: 'welcome-entry',
    authorName: 'L’équipage',
    authorGroup: 'Organisation',
    label: 'Bienvenue',
    text: 'Le Carnet de voyage de Patricia est prêt à accueillir vos souvenirs.',
    createdAt: new Date().toISOString(),
  },
];

const initialAppState = {
  eventRunning: false,
  participant: null,
  completedMissionIds: [],
  declinedMissionIds: [],
  encounterCount: 0,
  cooldownUntil: null,
  globalMissionCounts: {},
  activeGroupCounts: {},
  journalEntries: INITIAL_JOURNAL,
  privateMessages: [],
  passportFinalized: false,
  finalizedAt: null,
};

function getPassportNumber(participant) {
  if (!participant?.id) return 'P-0000';
  const numericValue = [...participant.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return `P-${String((numericValue % 9999) + 1).padStart(4, '0')}`;
}

function getTowerMessage(settings) {
  if (!settings?.tower_message_text) return null

  const expiresAt = settings.tower_message_expires_at

  if (
    expiresAt &&
    new Date(expiresAt).getTime() <= Date.now()
  ) {
    return null
  }

  return {
    id: settings.tower_message_id,
    icon: settings.tower_message_icon || '📢',
    title:
      settings.tower_message_title ||
      'Message de l’équipage',
    text: settings.tower_message_text,
    expiresAt,
  }
}

export default function App() {
  const [screen, setScreen] = useState('intro');
  const [showSplash, setShowSplash] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const [appState, setAppState] = useState(() =>
    readLocal('state', initialAppState)
  );
  const [registration, setRegistration] = useState({
    groupName: '',
    selectedLastName: '',
    firstName: '',
    customLastName: '',
    email: '',
  });

  const [travelMode, setTravelMode] = useState('solo');

  const [additionalTravelers, setAdditionalTravelers] = useState([]);

  const [currentMission, setCurrentMission] = useState(null);
  const [earnedDestination, setEarnedDestination] = useState(null);
  const [answer, setAnswer] = useState('');
  const [privateMessage, setPrivateMessage] = useState('');
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isStamping, setIsStamping] = useState(false);
  const [connectedParticipants, setConnectedParticipants] = useState([]);
  const [cockpitUpdatedAt, setCockpitUpdatedAt] = useState(null);
  const [grandTravelers, setGrandTravelers] = useState([]);
  const [towerMessage, setTowerMessage] = useState(null)

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    meetingPlace: '',
    meetingYear: '',
  })

  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)

  const [towerStats, setTowerStats] = useState({
    participants: 0,
    missions: 0,
    passports: 0,
    memories: 0,
  })
  const previousJournalCount = useRef(appState.journalEntries.length);

  const avatarInputRef = useRef(null);
  const missionPhotoInputRef = useRef(null);
  const missionAnswerRef = useRef(null);

  const participant = appState.participant;
  const passportNumber = getPassportNumber(participant);
  const currentPath = window.location.pathname;

  useEffect(() => {
    if (participant && screen === 'intro') {
      setScreen('home');
    }
  }, [participant, screen]);

const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    writeLocal('state', appState);
  }, [appState]);

  useEffect(() => {
    if (!participant) return
  
    setProfileForm({
      displayName:
        participant.displayName ||
        `${participant.firstName} ${participant.lastName}`,
      email: participant.email || '',
      meetingPlace: participant.meetingPlace || '',
      meetingYear: participant.meetingYear || '',
    })
  }, [participant])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return undefined
  
    retryPendingResponses()
  
    const interval = window.setInterval(
      retryPendingResponses,
      15000
    )
  
    window.addEventListener('online', retryPendingResponses)
  
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', retryPendingResponses)
    }
  }, [])

  useEffect(() => {
    if (appState.journalEntries.length > previousJournalCount.current) {
      if (screen !== 'journal')
        setToast('Une nouvelle entrée vient d’enrichir le carnet de Patricia.');
      previousJournalCount.current = appState.journalEntries.length;
    }
  }, [appState.journalEntries.length, screen]);

  useEffect(() => {
    if (!supabaseEnabled) return undefined;

    let active = true;

    async function bootstrap() {
      const [{ data: settings }, { data: entries }] = await Promise.all([
        supabase.from('event_settings').select('*').eq('id', 1).maybeSingle(),
        supabase
          .from('journal_entries')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (!active) return;

      setTowerMessage(getTowerMessage(settings))

      setAppState((prev) => ({
        ...prev,
        eventRunning: settings?.missions_running ?? prev.eventRunning,
        journalEntries: entries?.length
          ? entries.map((row) => ({
              id: row.id,
              authorName: row.author_name,
              authorGroup: row.author_group,
              label: row.label,
              text: row.content,
              createdAt: row.created_at,
            }))
          : prev.journalEntries,
      }));
    }

    bootstrap();

    const settingsChannel = supabase
  .channel('event-settings-live')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'event_settings' },
    (payload) => {
      const row = payload.new;

      if (row) {
        setTowerMessage(getTowerMessage(row))

        setAppState((prev) => ({
          ...prev,
          eventRunning: row.missions_running,
        }))
      }
    }
  )
  .subscribe();

    const journalChannel = supabase
      .channel('journal-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'journal_entries' },
        (payload) => {
          const row = payload.new;
          setAppState((prev) => ({
            ...prev,
            journalEntries: [
              {
                id: row.id,
                authorName: row.author_name,
                authorGroup: row.author_group,
                label: row.label,
                text: row.content,
                createdAt: row.created_at,
              },
              ...prev.journalEntries.filter((entry) => entry.id !== row.id),
            ],
          }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(journalChannel);
    };
  }, []);

  useEffect(() => {
    if (!supabaseEnabled || !participant?.id) return undefined;
    let active = true;

    async function updatePresence() {
      if (!active) return;
      await supabase
        .from('participants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', participant.id);
    }

    updatePresence();
    const interval = window.setInterval(updatePresence, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [participant?.id]);

  useEffect(() => {
    if (!supabaseEnabled || !adminUnlocked) return undefined;
    let active = true;

    async function refreshCockpit() {
      const activeSince = new Date(Date.now() - 45000).toISOString();

      const [{ data: online }, { data: travelers }] = await Promise.all([
        supabase
          .from('participants')
          .select('id, first_name, last_name, group_name, last_seen_at')
          .gte('last_seen_at', activeSince)
          .order('last_seen_at', { ascending: false }),
        supabase
          .from('participants')
          .select(
            'id, first_name, last_name, group_name, completed_missions, finalized_at'
          )
          .eq('passport_finalized', true)
          .order('completed_missions', { ascending: false })
          .order('finalized_at', { ascending: true })
          .limit(20),
      ]);

      if (!active) return;
      setConnectedParticipants(online || []);
      setGrandTravelers(travelers || []);
      setCockpitUpdatedAt(new Date());
    }

    refreshCockpit();
    const interval = window.setInterval(refreshCockpit, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [adminUnlocked]);
  useEffect(() => {
    if (!supabaseEnabled || currentPath !== '/tower') {
      return undefined
    }
  
    let active = true
  
    async function refreshTowerStats() {
      try {
        const [
          participantsResult,
          missionsResult,
          passportsResult,
          memoriesResult,
        ] = await Promise.all([
          supabase
            .from('participants')
            .select('*', { count: 'exact', head: true }),
  
          supabase
            .from('mission_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'),
  
          supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('passport_finalized', true),
  
          supabase
            .from('journal_entries')
            .select('*', { count: 'exact', head: true }),
        ])
  
        if (!active) return
  
        setTowerStats({
          participants: participantsResult.count || 0,
          missions: missionsResult.count || 0,
          passports: passportsResult.count || 0,
          memories: memoriesResult.count || 0,
        })
      } catch (error) {
        console.error(
          'Impossible de mettre à jour les statistiques de la tour :',
          error
        )
      }
    }
  
    refreshTowerStats()
  
    const interval = window.setInterval(
      refreshTowerStats,
      5000
    )
  
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [currentPath])

  const cooldownSeconds = useMemo(() => {
    if (!appState.cooldownUntil) return 0;
    return Math.max(0, Math.ceil((appState.cooldownUntil - now) / 1000));
  }, [appState.cooldownUntil, now]);

  const groupGuests = useMemo(() => {
    if (!registration.groupName) return [];
    return PRELOADED_GUESTS.filter(
      (guest) => guest.groupName === registration.groupName
    ).sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
  }, [registration.groupName]);

  const hasPreloadedNames = groupGuests.length > 0;

  const connectedGroupCounts = useMemo(() => {
    return connectedParticipants.reduce((counts, item) => {
      const groupName = item.group_name || 'Sans groupe';
      counts[groupName] = (counts[groupName] || 0) + 1;
      return counts;
    }, {});
  }, [connectedParticipants]);

  const sortedConnectedGroups = useMemo(
    () => Object.entries(connectedGroupCounts).sort(([, a], [, b]) => b - a),
    [connectedGroupCounts]
  );

  function closeSplash() {
    unlockSound()
    setSplashVisible(false)
  
    window.setTimeout(() => {
      setShowSplash(false)
    }, 500)
  }
  function updateAdditionalTraveler(index, field, value) {
    setAdditionalTravelers((current) =>
      current.map((traveler, travelerIndex) =>
        travelerIndex === index
          ? {
              ...traveler,
              [field]: value,
            }
          : traveler
      )
    );
  }
  
  function addAdditionalTraveler() {
    setAdditionalTravelers((current) => {
      if (current.length >= 4) return current;
  
      return [
        ...current,
        {
          firstName: '',
          lastName: '',
        },
      ];
    });
  }
  
  function removeAdditionalTraveler(index) {
    setAdditionalTravelers((current) => {
      const minimumAdditionalTravelers =
        travelMode === 'group' ? 2 : 1;
  
      if (current.length <= minimumAdditionalTravelers) {
        return current;
      }
  
      return current.filter(
        (_, travelerIndex) => travelerIndex !== index
      );
    });
  }

  function updateState(patch) {
    setAppState((prev) => ({ ...prev, ...patch }));
  }
  function goToTravelerHome() {
    setScreen('home');
  }
  
  function changeTraveler() {
    setAppState((previousState) => ({
      ...previousState,
      participant: null,
      completedMissionIds: [],
      declinedMissionIds: [],
      encounterCount: 0,
      cooldownUntil: null,
      passportFinalized: false,
      finalizedAt: null,
    }));
  
    setCurrentMission(null);
    setEarnedDestination(null);
    setAnswer('');
    setPrivateMessage('');
  
    setRegistration({
      groupName: '',
      selectedLastName: '',
      firstName: '',
      customLastName: '',
      email: '',
    });
    
    setTravelMode('solo');
    setAdditionalTravelers([]);
    setScreen('register');
  }

  function registerParticipant(nextParticipant) {
    const activeGroupCounts = {
      ...appState.activeGroupCounts,
      [nextParticipant.groupName]:
        (appState.activeGroupCounts[nextParticipant.groupName] || 0) + 1,
    };
    updateState({ participant: nextParticipant, activeGroupCounts });
    setScreen('briefing');
  }

  async function persistParticipant(nextParticipant) {
    if (!supabaseEnabled) return;

    await supabase.from('participants').upsert({
      id: nextParticipant.id,
      first_name: nextParticipant.firstName,
      last_name: nextParticipant.lastName,
      group_name: nextParticipant.groupName,
      last_seen_at: new Date().toISOString(),
    });
  }

  async function createParticipant() {
    const firstName = registration.firstName.trim();
    const email = registration.email.trim().toLowerCase();

    const mainTraveler = {
      firstName,
      lastName: (
        registration.selectedLastName === '__other__'
          ? registration.customLastName
          : registration.selectedLastName ||
            registration.customLastName
      ).trim(),
    };
    
    const otherTravelers = additionalTravelers.map(
      (traveler) => ({
        firstName: traveler.firstName.trim(),
        lastName: traveler.lastName.trim(),
      })
    );
    
    const members =
      travelMode === 'solo'
        ? [mainTraveler]
        : [mainTraveler, ...otherTravelers];
    
    const displayName =
      travelMode === 'solo'
        ? `${mainTraveler.firstName} ${mainTraveler.lastName}`
        : travelMode === 'couple'
          ? members
              .map((traveler) => traveler.firstName)
              .join(' & ')
          : members
              .map((traveler) => traveler.firstName)
              .join(', ');

              const lastName = mainTraveler.lastName;

    const groupName = registration.groupName;

    if (!groupName || !firstName || !lastName) {
      setToast(
        'Choisissez votre groupe puis complétez votre prénom et votre nom.'
      );
      return;
    }

    const hasIncompleteAdditionalTraveler =
  travelMode !== 'solo' &&
  otherTravelers.some(
    (traveler) =>
      !traveler.firstName || !traveler.lastName
  );

if (hasIncompleteAdditionalTraveler) {
  setToast(
    'Complétez le prénom et le nom de chaque voyageur.'
  );
  return;
}

    if (!supabaseEnabled) {
      const nextParticipant = {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        groupName,
      };

      registerParticipant(nextParticipant);
      return;
    }

    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, first_name, last_name, group_name, email, travel_mode, display_name, members, avatar_url, meeting_place, meeting_year, passport_finalized, finalized_at')
      .eq('group_name', groupName)
      .ilike('first_name', firstName)
      .ilike('last_name', lastName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError) {
      setToast(
        'Impossible de vérifier votre passeport. Réessayez dans quelques instants.'
      );
      return;
    }

    let nextParticipant;

    if (existingParticipant) {
      nextParticipant = {
        id: existingParticipant.id,
        firstName: existingParticipant.first_name,
        lastName: existingParticipant.last_name,
        groupName: existingParticipant.group_name,
        email: existingParticipant.email || '',
        travelMode: existingParticipant.travel_mode || 'solo',
        displayName:
          existingParticipant.display_name ||
          `${existingParticipant.first_name} ${existingParticipant.last_name}`,
        members:
          existingParticipant.members?.length
            ? existingParticipant.members
            : [
                {
                  firstName: existingParticipant.first_name,
                  lastName: existingParticipant.last_name,
                },
              ],
        avatarUrl: existingParticipant.avatar_url || '',
        meetingPlace: existingParticipant.meeting_place || '',
        meetingYear: existingParticipant.meeting_year || '',
      };
    }
    else {
      nextParticipant = {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        groupName,
        email,
        travelMode,
        displayName,
        members,
        avatarUrl: '',
        meetingPlace: '',
        meetingYear: '',
      };

      const { error: insertError } = await supabase
        .from('participants')
        .insert({
          id: nextParticipant.id,
          first_name: nextParticipant.firstName,
          last_name: nextParticipant.lastName,
          group_name: nextParticipant.groupName,
          email: email || null,
          travel_mode: travelMode,
          display_name: displayName,
          members,
          avatar_url: null,
          meeting_place: null,
          meeting_year: null,
          last_seen_at: new Date().toISOString(),
        });

      if (insertError) {
        setToast(
          'Votre passeport n’a pas pu être créé. Vérifiez la connexion.'
        );
        return;
      }
    }

    const { data: completedAssignments } = await supabase
      .from('mission_assignments')
      .select('mission_id')
      .eq('participant_id', nextParticipant.id)
      .eq('status', 'completed');

    const completedMissionIds = [
      ...new Set(
        (completedAssignments || []).map((assignment) => assignment.mission_id)
      ),
    ];

    setAppState((previousState) => ({
      ...previousState,
      participant: nextParticipant,
      completedMissionIds,
      passportFinalized: existingParticipant?.passport_finalized || false,
      finalizedAt: existingParticipant?.finalized_at || null,
      activeGroupCounts: {
        ...previousState.activeGroupCounts,
        [groupName]: (previousState.activeGroupCounts[groupName] || 0) + 1,
      },
    }));

    if (existingParticipant) {
      await supabase
        .from('participants')
        .update({
          last_seen_at: new Date().toISOString(),
          ...(email ? { email } : {}),
          travel_mode: travelMode,
          display_name: displayName,
          members,
        })
        .eq('id', nextParticipant.id);

      setScreen('home');
      setToast('Votre passeport et votre progression ont été retrouvés.');
    } else {
      setScreen('briefing');
    }
  }

  function drawMission() {
    if (appState.passportFinalized) {
      setToast(
        'Votre passeport est déjà validé : votre voyage est officiellement terminé.'
      );
      return;
    }

    const selected = selectMission({
      missions: MISSIONS,
      participant,
      completedMissionIds: appState.completedMissionIds,
      declinedMissionIds: appState.declinedMissionIds,
      globalMissionCounts: appState.globalMissionCounts,
      activeGroupCounts: appState.activeGroupCounts,
      encounterCount: appState.encounterCount,
    });

    if (!selected) {
      setToast(
        'Aucune autre mission compatible n’est disponible pour le moment.'
      );
      return;
    }

    setCurrentMission(selected);
    setAnswer('');
    setScreen('mission');
  }

  function requestAnotherMission() {
    if (!currentMission) return;
    updateState({
      declinedMissionIds: [...appState.declinedMissionIds, currentMission.id],
    });
    setCurrentMission(null);
    setScreen('home');
    setToast('Cette mission est mise de côté. Une autre pourra être tirée.');
  }

  function queuePendingResponse(entry) {
    const pendingResponses = readPendingResponses()
  
    const pendingResponse = {
      id: entry.id,
      participantId: participant.id,
      missionId: currentMission.id,
      authorName: `${participant.firstName} ${participant.lastName}`,
      authorGroup: participant.groupName,
      label: currentMission.journalLabel,
      content: entry.text,
      createdAt: entry.createdAt,
    }
  
    writePendingResponses([
      ...pendingResponses,
      pendingResponse,
    ])
  }

  async function retryPendingResponses() {
    if (!supabaseEnabled) return
  
    const pendingResponses = readPendingResponses()
  
    if (!pendingResponses.length) return
  
    const stillPending = []
    let sentCount = 0
  
    for (const response of pendingResponses) {
      const { error } = await supabase
        .from('journal_entries')
        .upsert(
          {
            id: response.id,
            participant_id: response.participantId,
            mission_id: response.missionId,
            author_name: response.authorName,
            author_group: response.authorGroup,
            label: response.label,
            content: response.content,
            created_at: response.createdAt,
          },
          { onConflict: 'id' }
        )
  
      if (error) {
        stillPending.push(response)
      } else {
        sentCount += 1
      }
    }
  
    writePendingResponses(stillPending)
  
    if (sentCount > 0) {
      setToast(
        sentCount === 1
          ? 'Votre réponse a bien été envoyée.'
          : `${sentCount} réponses en attente ont bien été envoyées.`
      )
    }
  }

  async function addJournalEntry(entry) {
    if (supabaseEnabled) {
      const { error } = await supabase
  .from('journal_entries')
  .upsert(
    {
      id: entry.id,
      participant_id: participant.id,
      mission_id: currentMission.id,
      author_name: `${participant.firstName} ${participant.lastName}`,
      author_group: participant.groupName,
      label: currentMission.journalLabel,
      content: entry.text,
    },
    { onConflict: 'id' }
  );
      if (error) throw error;
      return;
    }

    setAppState((prev) => ({
      ...prev,
      journalEntries: [entry, ...prev.journalEntries],
    }));
  }

  async function completeMission() {
    if (!currentMission) return;

    if (currentMission.responseType === 'text' && !answer.trim()) {
      setToast('Ajoutez votre réponse avant de valider la mission.');
      return;
    }

    const entryText =
      currentMission.responseType === 'photo'
        ? `Mission photo réalisée : ${currentMission.title}.`
        : answer.trim();

    const entry = {
      id: crypto.randomUUID(),
      authorName: `${participant.firstName} ${participant.lastName}`,
      authorGroup: participant.groupName,
      label: currentMission.journalLabel,
      text: entryText,
      createdAt: new Date().toISOString(),
    };

    try {
      await addJournalEntry(entry);

      const nextCompletedCount = appState.completedMissionIds.length + 1;
      const nextDestination =
        PASSPORT_DESTINATIONS[appState.completedMissionIds.length] ?? null;
      const nextGlobalMissionCounts = {
        ...appState.globalMissionCounts,
        [currentMission.id]:
          (appState.globalMissionCounts[currentMission.id] || 0) + 1,
      };

      updateState({
        completedMissionIds: [
          ...appState.completedMissionIds,
          currentMission.id,
        ],
        encounterCount:
          appState.encounterCount +
          (currentMission.missionKind === 'encounter' ? 1 : 0),
        cooldownUntil: Date.now() + randomCooldownSeconds() * 1000,
        globalMissionCounts: nextGlobalMissionCounts,
      });

      if (supabaseEnabled) {
        await supabase.from('mission_assignments').insert({
          participant_id: participant.id,
          mission_id: currentMission.id,
          status: 'completed',
        });

        await supabase
          .from('participants')
          .update({
            completed_missions: nextCompletedCount,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', participant.id);
      }

      setCurrentMission(null);
      setAnswer('');
      setEarnedDestination(nextDestination);

      if (nextDestination) {
        playStampSound();
        setScreen('stamp');
      } else {
        setScreen('home');
        setToast(
          'Mission accomplie : le carnet de Patricia vient de s’enrichir.'
        );
      }
    } catch (error) {
      console.error('ERREUR ENREGISTREMENT MISSION :', error);
    
      queuePendingResponse(entry);
    
      setToast(
        'Votre réponse est en cours d’envoi. Elle sera transmise dès que la connexion le permettra.'
      );
    }
  }

  async function handleAvatarChange(event) {
    const selectedFile = event.target.files?.[0]
  
    if (!selectedFile) return
  
    const fileName = selectedFile.name.toLowerCase()
  
    const isHeic =
      selectedFile.type === 'image/heic' ||
      selectedFile.type === 'image/heif' ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
  
    const isRegularImage = selectedFile.type.startsWith('image/')
  
    if (!isRegularImage && !isHeic) {
      setToast('Veuillez choisir une image.')
      event.target.value = ''
      return
    }
  
    if (selectedFile.size > 10 * 1024 * 1024) {
      setToast('La photo est trop lourde. Taille maximale : 10 Mo.')
      event.target.value = ''
      return
    }
  
    try {
      let finalFile = selectedFile
  
      if (isHeic) {
        setToast('Conversion de la photo iPhone en cours…')
  
        const heic2anyModule = await import('heic2any');
        const convertHeic = heic2anyModule.default || heic2anyModule;

        const convertedResult = await convertHeic({
          blob: selectedFile,
          toType: 'image/jpeg',
          quality: 0.85,
        });
  
        const convertedBlob = Array.isArray(convertedResult)
          ? convertedResult[0]
          : convertedResult
  
        const jpegName = selectedFile.name.replace(
          /\.(heic|heif)$/i,
          '.jpg'
        )
  
        finalFile = new File([convertedBlob], jpegName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      }
  
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
  
      const previewUrl = URL.createObjectURL(finalFile)
  
      setAvatarFile(finalFile)
      setAvatarPreview(previewUrl)
  
      if (isHeic) {
        setToast('Photo iPhone convertie. Vous pouvez enregistrer le profil.')
      }
    } catch (error) {
      console.error('Erreur de conversion HEIC :', error)
  
      console.error(
        'Détail de l’erreur HEIC :',
        error?.code,
        error?.message,
        error
      )
      
      setToast(
        'Cette photo HEIC ne peut pas être convertie. Sur iPhone, choisissez une capture d’écran de la photo ou réglez Appareil photo > Formats > Le plus compatible.'
      )
      
      event.target.value = ''
    }
  }

  async function saveProfile() {
    if (!participant?.id) return;
  
    const cleanedDisplayName = profileForm.displayName.trim();
    const cleanedEmail = profileForm.email.trim().toLowerCase();
    const cleanedMeetingPlace = profileForm.meetingPlace.trim();
    const cleanedMeetingYear = profileForm.meetingYear.trim();
  
    if (!cleanedDisplayName) {
      setToast('Indiquez le nom à afficher sur votre passeport.');
      return;
    }
  
    try {
      let avatarUrl =
        participant.avatarUrl ||
        participant.avatar_url ||
        null;
  
      /*
       * Si une nouvelle image a été choisie :
       * 1. elle est envoyée dans le bucket Supabase "avatars" ;
       * 2. son adresse publique est enregistrée dans le participant.
       */
      if (avatarFile && supabaseEnabled) {
        const extension =
          avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  
        const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
  
        const avatarPath = `${participant.id}/avatar-${Date.now()}.${safeExtension}`;
  
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: avatarFile.type,
          });
  
        if (uploadError) {
          throw uploadError;
        }
  
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarPath);
  
        avatarUrl = publicUrlData.publicUrl;
      }
  
      if (supabaseEnabled) {
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            display_name: cleanedDisplayName,
            email: cleanedEmail || null,
            meeting_place: cleanedMeetingPlace || null,
            meeting_year: cleanedMeetingYear || null,
            avatar_url: avatarUrl,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', participant.id);
  
        if (updateError) {
          throw updateError;
        }
      }
  
      const updatedParticipant = {
        ...participant,
        displayName: cleanedDisplayName,
        email: cleanedEmail,
        meetingPlace: cleanedMeetingPlace,
        meetingYear: cleanedMeetingYear,
        avatarUrl,
      };
  
      setAppState((previousState) => ({
        ...previousState,
        participant: updatedParticipant,
      }));
  
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
  
      setAvatarFile(null);
      setAvatarPreview(avatarUrl || '');
      setToast('Votre profil et votre photo ont bien été enregistrés.');
      setScreen('home');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil :', error);
  
      setToast(
        error?.message ||
          'Le profil n’a pas pu être enregistré. Vérifiez la connexion.'
      );
    }
  }

  async function savePrivateMessage() {
    if (!privateMessage.trim()) {
      setToast('Écrivez votre message avant de le confier à l’équipage.');
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      authorName: `${participant.firstName} ${participant.lastName}`,
      authorGroup: participant.groupName,
      content: privateMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    if (supabaseEnabled) {
      const { error } = await supabase.from('private_messages').insert({
        participant_id: participant.id,
        author_name: message.authorName,
        author_group: message.authorGroup,
        content: message.content,
      });

      if (error) {
        setToast('Le message privé n’a pas pu être enregistré.');
        return;
      }
    } else {
      setAppState((prev) => ({
        ...prev,
        privateMessages: [message, ...prev.privateMessages],
      }));
    }

    setPrivateMessage('');
    setScreen('private-confirmed');
  }

  async function setEventRunning(value) {
    updateState({ eventRunning: value });

    if (supabaseEnabled) {
      await supabase.from('event_settings').upsert({
        id: 1,
        missions_running: value,
        updated_at: new Date().toISOString(),
      });
    }
  }

  function unlockAdmin() {
    if (adminPin === CONFIG.adminPin) {
      setAdminUnlocked(true);
      setAdminPin('');
    } else {
      setToast('Code équipage incorrect.');
    }
  }

  async function validatePassport() {
    if (appState.passportFinalized || isStamping) return;

    const completedCount = appState.completedMissionIds.length;
    if (completedCount < 3) {
      setToast(
        'Il faut obtenir les trois visas avant de valider définitivement le passeport.'
      );
      return;
    }

    const finalizedAt = new Date().toISOString();
    setIsStamping(true);
    playStampSound();

    if (supabaseEnabled) {
      const { error } = await supabase
        .from('participants')
        .update({
          completed_missions: completedCount,
          passport_finalized: true,
          finalized_at: finalizedAt,
          last_seen_at: finalizedAt,
        })
        .eq('id', participant.id);

      if (error) {
        setIsStamping(false);
        setToast('La validation du passeport n’a pas pu être enregistrée.');
        return;
      }
    }

    window.setTimeout(() => {
      updateState({ passportFinalized: true, finalizedAt });
      setIsStamping(false);
      setScreen('passport-finalized');
    }, 2400);
  }

  function resetDemo() {
    clearLocal();
    window.location.reload();
  }

  if (currentPath === '/mimou') {
    return <MimouPage />
  }

  if (currentPath === '/tower') {
    return (
      <TowerScreen
        eventRunning={appState.eventRunning}
        towerMessage={towerMessage}
        stats={towerStats}
      />
    )
  }
  
  if (currentPath === '/command') {
    return (
      <>
        <Toast
          message={toast}
          onClose={() => setToast('')}
        />
  
        {!adminUnlocked ? (
          <Layout compact>
            <p className="eyebrow">
              Accès réservé à l’équipage
            </p>
  
            <h1>Poste de commandement</h1>
  
            <section className="admin-login">
              <label htmlFor="command-pin">
                Code équipage
              </label>
  
              <input
                id="command-pin"
                type="password"
                inputMode="numeric"
                value={adminPin}
                onChange={event =>
                  setAdminPin(event.target.value)
                }
                placeholder="••••"
              />
  
              <button
                className="button button--dark"
                onClick={unlockAdmin}
              >
                Ouvrir le poste de commandement
              </button>
            </section>
          </Layout>
        ) : (
          <CommandCenter
            eventRunning={appState.eventRunning}
            towerMessage={towerMessage}
            onSetEventRunning={setEventRunning}
          />
        )}
      </>
    )
  }

  if (showSplash) {
    return (
      <SplashScreen
        visible={splashVisible}
        onContinue={closeSplash}
      />
    )
  };

  return (
    <>
      <Toast message={toast} onClose={() => setToast('')} />

      {participant &&
  !['intro', 'register', 'briefing', 'admin'].includes(screen) && (
    <TravelerNav
      participant={participant}
      onHome={goToTravelerHome}
      onPassport={() => setScreen('passport')}
      onProfile={() => setScreen('profile')}
      onChangeTraveler={changeTraveler}
    />
  )}

      {screen === 'intro' && (
        <main className="hero">
          <div className="hero__map" />
          <div className="hero__stamp">
            VISA
            <br />
            RETRAITE
          </div>
          <p className="hero__airline">PK AIRLINES · VOL PK 1608</p>
          <p className="hero__eyebrow">Bienvenue à bord</p>
          <h1>
            Le Passeport
            <br />
            <em>de Patricia</em>
          </h1>
          <p className="hero__lead">
            Une soirée, des missions et un carnet collectif pour offrir à Mimou
            un souvenir écrit par tous ceux qui font partie de son voyage.
          </p>
          <button
            className="button button--gold"
            onClick={() => {
              unlockSound();
              setScreen('register');
            }}
          >
            Présenter mon passeport <span>✈</span>
          </button>
          <button
            className="button button--ghost"
            onClick={() => setScreen('admin')}
          >
            Accès équipage
          </button>
        </main>
      )}

      {screen === 'register' && (
        <Layout>
          <p className="eyebrow">Contrôle des passeports</p>
          <h1>Qui voyage aujourd’hui ?</h1>
          <p className="subtitle">
            Choisissez d’abord votre groupe, puis votre nom de famille. Indiquez
            ensuite votre prénom.
          </p>
          <section className="travel-mode-selector">
  <p className="travel-mode-selector__label">
    Comment participez-vous aujourd’hui ?
  </p>

  <div className="travel-mode-selector__grid">
    <button
      type="button"
      className={
        travelMode === 'solo'
          ? 'travel-mode-card travel-mode-card--selected'
          : 'travel-mode-card'
      }
      onClick={() => {
        setTravelMode('solo');
        setAdditionalTravelers([]);
      }}
    >
      <span>👤</span>
      <strong>Seul(e)</strong>
      <small>Un voyageur</small>
    </button>

    <button
      type="button"
      className={
        travelMode === 'couple'
          ? 'travel-mode-card travel-mode-card--selected'
          : 'travel-mode-card'
      }
      onClick={() => {
        setTravelMode('couple');
        setAdditionalTravelers([
          {
            firstName: '',
            lastName: '',
          },
        ]);
      }}
    >
      <span>👥</span>
      <strong>À deux</strong>
      <small>Un passeport commun</small>
    </button>

    <button
      type="button"
      className={
        travelMode === 'group'
          ? 'travel-mode-card travel-mode-card--selected'
          : 'travel-mode-card'
      }
      onClick={() => {
        setTravelMode('group');

        setAdditionalTravelers(current =>
          current.length >= 2
            ? current
            : [
                {
                  firstName: '',
                  lastName: '',
                },
                {
                  firstName: '',
                  lastName: '',
                },
              ]
        );
      }}
    >
      <span>👨‍👩‍👧‍👦</span>
      <strong>En groupe</strong>
      <small>De 3 à 5 voyageurs</small>
    </button>
  </div>
</section>

          <label htmlFor="registration-group">Votre groupe</label>
          <select
            id="registration-group"
            value={registration.groupName}
            onChange={(event) =>
              setRegistration({
                groupName: event.target.value,
                selectedLastName: '',
                firstName: '',
                customLastName: '',
                email: '',
              })
            }
          >
            <option value="">Choisir un groupe…</option>
            {GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          {registration.groupName && hasPreloadedNames && (
            <>
              <label htmlFor="registration-last-name">Nom de famille</label>
              <select
                id="registration-last-name"
                value={registration.selectedLastName}
                onChange={(event) =>
                  setRegistration({
                    ...registration,
                    selectedLastName: event.target.value,
                    customLastName: '',
                  })
                }
              >
                <option value="">Choisir un nom…</option>
                {groupGuests.map((guest) => (
                  <option key={guest.id} value={guest.lastName}>
                    {guest.lastName}
                  </option>
                ))}
                <option value="__other__">
                  Mon nom n’est pas dans la liste
                </option>
              </select>
            </>
          )}

          {registration.groupName &&
            (registration.selectedLastName === '__other__' ||
              !hasPreloadedNames) && (
              <>
                <label htmlFor="registration-custom-last-name">Votre nom</label>
                <input
                  id="registration-custom-last-name"
                  value={registration.customLastName}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      customLastName: event.target.value,
                    })
                  }
                  placeholder="Nom"
                  autoComplete="family-name"
                />
              </>
            )}

          {registration.groupName &&
            (!hasPreloadedNames ||
              registration.selectedLastName === '__other__' ||
              (registration.selectedLastName &&
                registration.selectedLastName !== '__other__')) && (
              <>
                <label htmlFor="registration-first-name">Votre prénom</label>
                <input
                  id="registration-first-name"
                  value={registration.firstName}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      firstName: event.target.value,
                    })
                  }
                  placeholder="Prénom"
                  autoComplete="given-name"
                />
                <label htmlFor="registration-email">
  Adresse e-mail (facultatif)
</label>

<input
  id="registration-email"
  type="email"
  inputMode="email"
  value={registration.email}
  onChange={(event) =>
    setRegistration({
      ...registration,
      email: event.target.value,
    })
  }
  placeholder="nom@exemple.be"
  autoComplete="email"
/>

<small className="form-help">
  Elle servira uniquement à vous envoyer le lien vers les photos de la soirée.
</small>

{travelMode !== 'solo' && (
  <section className="additional-travelers">
    <div className="additional-travelers__heading">
      <div>
        <p className="eyebrow">
          {travelMode === 'couple'
            ? 'Deuxième voyageur'
            : 'Autres voyageurs'}
        </p>

        <h2>
          {travelMode === 'couple'
            ? 'Qui voyage avec vous ?'
            : 'Qui compose votre groupe ?'}
        </h2>
      </div>

      <span>
        {additionalTravelers.length + 1}/
        {travelMode === 'couple' ? 2 : 5}
      </span>
    </div>

    {additionalTravelers.map((traveler, index) => (
      <article
        className="additional-traveler-card"
        key={index}
      >
        <div className="additional-traveler-card__title">
          <strong>Voyageur {index + 2}</strong>

          {travelMode === 'group' &&
            additionalTravelers.length > 2 && (
              <button
                type="button"
                onClick={() =>
                  removeAdditionalTraveler(index)
                }
                aria-label={`Supprimer le voyageur ${
                  index + 2
                }`}
              >
                ×
              </button>
            )}
        </div>

        <label
          htmlFor={`additional-first-name-${index}`}
        >
          Prénom
        </label>

        <input
          id={`additional-first-name-${index}`}
          value={traveler.firstName}
          onChange={(event) =>
            updateAdditionalTraveler(
              index,
              'firstName',
              event.target.value
            )
          }
          placeholder="Prénom"
          autoComplete="off"
        />

        <label
          htmlFor={`additional-last-name-${index}`}
        >
          Nom
        </label>

        <input
          id={`additional-last-name-${index}`}
          value={traveler.lastName}
          onChange={(event) =>
            updateAdditionalTraveler(
              index,
              'lastName',
              event.target.value
            )
          }
          placeholder="Nom"
          autoComplete="off"
        />
      </article>
    ))}

    {travelMode === 'group' &&
      additionalTravelers.length < 4 && (
        <button
          type="button"
          className="additional-travelers__add"
          onClick={addAdditionalTraveler}
        >
          ＋ Ajouter un voyageur
        </button>
      )}

    <small className="form-help">
      Tous les voyageurs inscrits ici partageront le même
      passeport et la même progression.
    </small>
  </section>
)}
                <button
                  className="button button--dark"
                  onClick={createParticipant}
                >
                  Créer mon passeport
                </button>
              </>
            )}

          <button className="text-button" onClick={() => setScreen('intro')}>
            ← Retour
          </button>
        </Layout>
      )}

      {screen === 'briefing' && participant && (
        <Layout>
          <p className="eyebrow">Votre mission collective</p>
          <h1>Écrivons son carnet ensemble</h1>
          <PassportCard
            participant={participant}
            passportNumber={passportNumber}
          />

          <section className="briefing">
            <p>
              <strong>
                Aujourd’hui, nous allons écrire ensemble le Carnet de voyage de
                Patricia.
              </strong>
            </p>
            <p>
              Au fil de la soirée, l’application vous proposera des souvenirs,
              défis, photos et rencontres.
            </p>
            <p>
              Chaque réponse validée enrichira immédiatement le carnet
              collectif.
            </p>
            <p>
              Chacun participe à son rythme. Le voyageur qui aura validé le plus
              de missions pourra recevoir le titre de Grand Voyageur. Entre deux
              missions, profitez surtout de la soirée.
            </p>
          </section>

          <button
            className="button button--gold"
            onClick={() => setScreen('home')}
          >
            Ouvrir mon passeport
          </button>
        </Layout>
      )}

      {screen === 'home' && participant && (
        <Layout compact>
          <div className="home-heading">
            <div>
              <p className="eyebrow">Passeport validé</p>
              <h1>
                Bonjour {participant.displayName || participant.firstName}
              </h1>
            </div>
            <button
              className="mini-passport"
              onClick={() => setScreen('passport')}
              aria-label="Voir mon passeport"
            >
              <span>🛂</span>
              <small>Passeport</small>
            </button>
          </div>

          <AnnouncementBanner />
          
          <FlightBoard
            completedCount={appState.completedMissionIds.length}
            eventRunning={appState.eventRunning}
            passportFinalized={appState.passportFinalized}
            cooldownSeconds={cooldownSeconds}
            onStartMission={drawMission}
          />

          {appState.eventRunning &&
            cooldownSeconds > 0 &&
            !appState.passportFinalized && (
              <Countdown seconds={cooldownSeconds} />
            )}

          <button
            className="navigation-card"
            onClick={() => setScreen('journal')}
          >
            <span>📖</span>
            <div>
              <strong>Le Carnet de voyage de Patricia</strong>
              <small>
                {appState.journalEntries.length} entrée(s) partagée(s)
              </small>
            </div>
            <i>›</i>
          </button>

          <button
            className="navigation-card"
            onClick={() => setScreen('private')}
          >
            <span>💌</span>
            <div>
              <strong>Un petit mot privé pour Mimou</strong>
              <small>Visible uniquement par Mimou après la soirée</small>
            </div>
            <i>›</i>
          </button>

          <button
            className="navigation-card"
            onClick={() => window.open(CONFIG.albumUrl, '_blank')}
          >
            <span>📸</span>
            <div>
              <strong>Ajouter vos photos</strong>
              <small>
                Partagez vos photos de la soirée dans l’album de Patricia
              </small>
            </div>
            <i>›</i>
          </button>

          <p className="connection-note">
            {supabaseEnabled
              ? '● Mode soirée connecté'
              : '● Mode démonstration locale'}
          </p>
        </Layout>
      )}

{screen === 'profile' && participant && (
  <Layout>
    <p className="eyebrow">Profil voyageur</p>

    <h1>Mon profil</h1>

    <p className="subtitle">
      Personnalisez votre passeport.
      Vous pourrez modifier ces informations
      quand vous le souhaitez.
    </p>

    <section className="profile-card">

    <div className="profile-avatar">
  <button
    className="profile-avatar__button"
    type="button"
    onClick={() => avatarInputRef.current?.click()}
  >
    {avatarPreview || participant.avatarUrl ? (
      <img
        src={avatarPreview || participant.avatarUrl}
        alt="Photo du passeport"
      />
    ) : (
      <>
        <span>📷</span>
        <small>Ajouter une photo</small>
      </>
    )}
  </button>

  <input
    ref={avatarInputRef}
    type="file"
    accept="image/jpeg,image/png"    
    capture="user"
    onChange={handleAvatarChange}
    hidden
  />
</div>

      <label>Nom affiché</label>

      <input
        value={profileForm.displayName}
        onChange={(event)=>
          setProfileForm({
            ...profileForm,
            displayName:event.target.value,
          })
        }
      />

      <label>Adresse e-mail</label>

      <input
        type="email"
        value={profileForm.email}
        onChange={(event)=>
          setProfileForm({
            ...profileForm,
            email:event.target.value,
          })
        }
      />

      <label>
        Où avez-vous rencontré Patricia ?
      </label>

      <input
        value={profileForm.meetingPlace}
        placeholder="Ex : École, Hôpital..."
        onChange={(event)=>
          setProfileForm({
            ...profileForm,
            meetingPlace:event.target.value,
          })
        }
      />

      <label>
        Depuis quelle année ?
      </label>

      <input
        value={profileForm.meetingYear}
        placeholder="Ex : 1998"
        onChange={(event)=>
          setProfileForm({
            ...profileForm,
            meetingYear:event.target.value,
          })
        }
      />

    </section>

    <button
      type="button"
      className="button button--gold"
      onClick={saveProfile}
    >
      Enregistrer mon profil
    </button>

    <button
      className="text-button"
      onClick={() => setScreen('home')}
    >
      ← Retour
    </button>

  </Layout>
)}

      {screen === 'passport' && participant && (
        <Layout>
          <p className="eyebrow">Document de voyage</p>
          <h1>Votre passeport</h1>

          <PassportBook
            participant={participant}
            passportNumber={passportNumber}
            completedCount={appState.completedMissionIds.length}
            passportFinalized={appState.passportFinalized}
            isStamping={isStamping}
            onValidate={validatePassport}
            onEditProfile={() => setScreen('profile')}
          />

          <button className="text-button" onClick={() => setScreen('home')}>
            ← Retour
          </button>
        </Layout>
      )}

      {screen === 'stamp' && earnedDestination && (
        <Layout compact>
          <StampReveal
            destination={earnedDestination}
            completedCount={appState.completedMissionIds.length}
            onContinue={() => {
              setEarnedDestination(null);
              setScreen('passport');
            }}
          />
        </Layout>
      )}

      {screen === 'mission' && currentMission && (
        <Layout>
          <p className="eyebrow">Carte d’embarquement</p>
          <h1>{currentMission.title}</h1>

          <section className="boarding-pass">
            <div className="boarding-pass__header">
              <span>PK AIRLINES</span>
              <strong>MISSION</strong>
            </div>
            <div className="boarding-pass__body">
              <small>CONSIGNE</small>
              <p>{currentMission.prompt}</p>
            </div>
            <div className="boarding-pass__footer">
              <span>PK-{currentMission.id.slice(-2).toUpperCase()}</span>
              <div className="barcode" />
            </div>
          </section>

          {currentMission.responseType === 'text' && (
            <>
              <label htmlFor="mission-answer">
                Votre contribution au carnet
              </label>
              <textarea
  ref={missionAnswerRef}
  id="mission-answer"
  value={answer}
  onChange={(event) => setAnswer(event.target.value)}
  onFocus={() => {
    window.setTimeout(() => {
      missionAnswerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 350)
  }}
  rows="7"
  placeholder="Écrivez votre réponse ici…"
/>
            </>
          )}

{currentMission.responseType === 'photo' && (
  <section className="photo-mission">
    <span>📷</span>

    <div>
      <strong>Utilisez l’appareil photo de votre téléphone.</strong>
      <p>
        Prenez votre photo maintenant, puis ajoutez-la à
        l’album partagé si vous le souhaitez.
      </p>
    </div>

    <input
      ref={missionPhotoInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
    />

    <button
      type="button"
      className="button button--gold"
      onClick={() => missionPhotoInputRef.current?.click()}
    >
      📷 Prendre une photo
    </button>

    <a
      className="button button--outline"
      href={CONFIG.albumUrl}
      target="_blank"
      rel="noreferrer"
    >
      Ouvrir l’album partagé
    </a>
  </section>
)}

          <button className="button button--gold" onClick={completeMission}>
            Mission accomplie
          </button>
          <button
            className="button button--soft"
            onClick={requestAnotherMission}
          >
            🎲 Proposer une autre mission
          </button>
        </Layout>
      )}

      {screen === 'journal' && (
        <Layout>
          <p className="eyebrow">Mémoire collective</p>
          <h1>Le Carnet de voyage de Patricia</h1>
          <p className="subtitle">
            Chaque horizon de sa vie apporte ici ses souvenirs, ses anecdotes et
            son regard.
          </p>

          <div className="journal">
            {appState.journalEntries.map((entry) => (
              <article className="journal-entry" key={entry.id}>
                <div className="journal-entry__stamp">{entry.label}</div>
                <p>{entry.text}</p>
                <footer>
                  <strong>{entry.authorName}</strong>
                  <span>{entry.authorGroup}</span>
                  <time>
                    {new Date(entry.createdAt).toLocaleTimeString('fr-BE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </footer>
              </article>
            ))}
          </div>

          <button className="text-button" onClick={() => setScreen('home')}>
            ← Retour au passeport
          </button>
        </Layout>
      )}

      {screen === 'private' && participant && (
        <Layout>
          <p className="eyebrow">Courrier confidentiel</p>
          <h1>Un petit mot pour Mimou</h1>
          <p className="subtitle">
            Ce message ne sera jamais publié dans le carnet collectif. Mimou le
            récupérera après la soirée.
          </p>

          <label htmlFor="private-message">Votre message privé</label>
          <textarea
            id="private-message"
            value={privateMessage}
            onChange={(event) => setPrivateMessage(event.target.value)}
            rows="10"
            placeholder="Écrivez ici ce que vous souhaitez lui confier…"
          />

          <button className="button button--gold" onClick={savePrivateMessage}>
            Confier mon message à l’équipage
          </button>
          <button className="text-button" onClick={() => setScreen('home')}>
            ← Retour
          </button>
        </Layout>
      )}

      {screen === 'private-confirmed' && (
        <Layout compact>
          <section className="confirmation-card">
            <div className="confirmation-card__seal">💌</div>
            <p className="eyebrow">Message enregistré</p>
            <h1>Courrier confié à l’équipage</h1>
            <p>
              Mimou découvrira votre message après la soirée - MERCI 💌
            </p>
          </section>
          <button
            className="button button--dark"
            onClick={() => setScreen('home')}
          >
            Retour au passeport
          </button>
        </Layout>
      )}

      {screen === 'passport-finalized' && participant && (
        <Layout compact>
          <PassportCelebration />

          <section className="passport-farewell">
            <div className="passport-farewell__seal">🛂</div>
            <p className="eyebrow">Passeport validé</p>
            <h1>
              Bon voyage,
              <br />
              {participant.firstName}
            </h1>
            <p>Votre passeport est officiellement validé.</p>

            <div className="passport-summary">
              <div>
                <strong>{appState.completedMissionIds.length}</strong>
                <span>Tampons</span>
              </div>
              <div>
                <strong>
                  {Math.min(3, appState.completedMissionIds.length)}
                </strong>
                <span>Visas</span>
              </div>
              <div>
                <strong>{passportNumber}</strong>
                <span>N° Passeport</span>
              </div>
            </div>

            <p>
              Merci d’avoir participé au voyage de Patricia et d’avoir contribué
              à enrichir son carnet de souvenirs.
            </p>

            <div className="passport-farewell__number">{passportNumber}</div>
          </section>

          <button
            className="button button--dark"
            onClick={() => setScreen('passport')}
          >
            Voir mon passeport validé
          </button>
          <button className="text-button" onClick={() => setScreen('home')}>
            Retour à l’accueil
          </button>
        </Layout>
      )}

      {screen === 'admin' && (
        <Layout compact>
          <p className="eyebrow">Accès réservé à l’équipage</p>
          <h1>Centre de contrôle</h1>

          {!adminUnlocked ? (
            <section className="admin-login">
              <label htmlFor="admin-pin">Code équipage</label>
              <input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                value={adminPin}
                onChange={(event) => setAdminPin(event.target.value)}
                placeholder="••••"
              />
              <button className="button button--dark" onClick={unlockAdmin}>
                Ouvrir le centre de contrôle
              </button>
            </section>
          ) : (
            <>
              <section
                className={`event-status ${
                  appState.eventRunning ? 'event-status--running' : ''
                }`}
              >
                <span>●</span>
                <div>
                  <small>ÉTAT DES MISSIONS</small>
                  <strong>
                    {appState.eventRunning ? 'En cours' : 'En pause'}
                  </strong>
                </div>
              </section>

              <button
                className={`button ${
                  appState.eventRunning ? 'button--red' : 'button--gold'
                }`}
                onClick={() => setEventRunning(!appState.eventRunning)}
              >
                {appState.eventRunning
                  ? '⏸ Mettre les missions en pause'
                  : '▶ Démarrer les missions'}
              </button>

              <section className="cockpit-presence">
                <div className="cockpit-presence__heading">
                  <div>
                    <small>VOYAGEURS ACTUELLEMENT CONNECTÉS</small>
                    <strong>{connectedParticipants.length}</strong>
                  </div>
                  <span className="cockpit-live-indicator">
                    <i /> EN DIRECT
                  </span>
                </div>

                {supabaseEnabled ? (
                  <>
                    {sortedConnectedGroups.length > 0 ? (
                      <div className="cockpit-groups">
                        {sortedConnectedGroups.map(([groupName, count]) => (
                          <div className="cockpit-group" key={groupName}>
                            <span>{groupName}</span>
                            <div className="cockpit-group__bar">
                              <i
                                style={{
                                  width: `${
                                    connectedParticipants.length
                                      ? Math.max(
                                          8,
                                          (count /
                                            connectedParticipants.length) *
                                            100
                                        )
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="cockpit-empty">
                        Aucun voyageur actif durant les 45 dernières secondes.
                      </p>
                    )}

                    {connectedParticipants.length > 0 && (
                      <div className="cockpit-recent">
                        <h3>Présences récentes</h3>
                        {connectedParticipants.slice(0, 8).map((item) => (
                          <div key={item.id}>
                            <span>
                              {item.first_name} {item.last_name}
                            </span>
                            <small>{item.group_name}</small>
                          </div>
                        ))}
                      </div>
                    )}

                    {cockpitUpdatedAt && (
                      <p className="cockpit-refresh-note">
                        Actualisé à{' '}
                        {cockpitUpdatedAt.toLocaleTimeString('fr-BE', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="cockpit-empty">
                    Le suivi en direct sera visible lorsque Supabase sera
                    connecté.
                  </p>
                )}
              </section>

              <section className="grand-traveler-panel">
                <div className="grand-traveler-panel__heading">
                  <div>
                    <small>CHALLENGE INDIVIDUEL</small>
                    <h2>Grand Voyageur</h2>
                  </div>
                  <span>🏆</span>
                </div>

                {supabaseEnabled && grandTravelers.length > 0 ? (
                  <>
                    <div className="grand-traveler-leader">
                      <span>En tête actuellement</span>
                      <strong>
                        {grandTravelers[0].first_name}{' '}
                        {grandTravelers[0].last_name}
                      </strong>
                      <small>{grandTravelers[0].group_name}</small>
                      <div>
                        {grandTravelers[0].completed_missions} mission
                        {grandTravelers[0].completed_missions > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="grand-traveler-list">
                      {grandTravelers.slice(1, 10).map((traveler, index) => (
                        <div key={traveler.id}>
                          <span>{index + 2}</span>
                          <div>
                            <strong>
                              {traveler.first_name} {traveler.last_name}
                            </strong>
                            <small>{traveler.group_name}</small>
                          </div>
                          <b>{traveler.completed_missions}</b>
                        </div>
                      ))}
                    </div>

                    <p className="grand-traveler-note">
                      Seuls les passeports définitivement validés apparaissent
                      ici. En cas d’égalité, un tirage au sort peut départager
                      les meilleurs scores.
                    </p>
                  </>
                ) : (
                  <p className="cockpit-empty">
                    {supabaseEnabled
                      ? 'Aucun passeport n’a encore été définitivement validé.'
                      : 'Le classement sera disponible lorsque Supabase sera connecté.'}
                  </p>
                )}
              </section>

              <div className="admin-stats">
                <div>
                  <strong>{appState.journalEntries.length}</strong>
                  <span>Entrées dans le carnet</span>
                </div>
                <div>
                  <strong>{appState.privateMessages.length}</strong>
                  <span>Messages privés locaux</span>
                </div>
                <div>
                  <strong>{appState.completedMissionIds.length}</strong>
                  <span>Missions sur cet appareil</span>
                </div>
              </div>

              {!supabaseEnabled && (
                <button className="button button--soft" onClick={resetDemo}>
                  Réinitialiser la démonstration locale
                </button>
              )}
            </>
          )}

          <button className="text-button" onClick={() => setScreen('intro')}>
            ← Retour à l’accueil
          </button>
        </Layout>
      )}
    </>
  );
}