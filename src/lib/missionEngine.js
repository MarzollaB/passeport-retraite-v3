import { CONFIG } from './config'

function isCompatible(mission, participant) {
  if (!participant) return false
  if (mission.sourceGroups.includes('*')) return true
  return mission.sourceGroups.includes(participant.groupName)
}

export function selectMission({
  missions,
  participant,
  completedMissionIds,
  declinedMissionIds,
  globalMissionCounts,
  encounterCount,
}) {
  const available = missions.filter(mission => {
    if (completedMissionIds.includes(mission.id)) return false
    if (declinedMissionIds.includes(mission.id)) return false
    if (!isCompatible(mission, participant)) return false
    if (
      mission.missionKind === 'encounter' &&
      encounterCount >= CONFIG.maxEncounterMissionsPerParticipant
    ) return false

    const globalCount = globalMissionCounts[mission.id] || 0
    return globalCount < (mission.maxAssignments || CONFIG.maxAssignmentsPerMission)
  })

  if (!available.length) return null

  const weighted = available.flatMap(mission =>
    Array.from({ length: Math.max(1, mission.weight || 1) }, () => mission)
  )

  return weighted[Math.floor(Math.random() * weighted.length)]
}
