import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../utils/api';
import { useStore } from '../store/appStore';
import { Project } from '../types';

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

export const useProjectsForCurrentUser = () => {
    const { data: projects = [], isLoading, isError } = useQuery({ queryKey: ['projects'], queryFn: api.fetchProjects });
    const currentUser = useStore(state => state.currentUser);

    const visibleProjects = useMemo(() => {
        if (!projects || projects.length === 0) return [];
        if (!currentUser || currentUser.role === 'Admin' || !currentUser.assignedProjects || currentUser.assignedProjects.length === 0) {
            return projects;
        }

        const projectsById = new Map(projects.map(p => [p.id, p]));
        const visibleProjectIds = new Set<string>();

        currentUser.assignedProjects.forEach(id => {
            // Add the assigned project itself
            visibleProjectIds.add(id);

            // Add all ancestors
            // FIX: Explicitly type `current` as `Project | undefined` to help TypeScript's type inference.
            let current: Project | undefined = projectsById.get(id);
            while (current && current.parentId) {
                visibleProjectIds.add(current.parentId);
                current = projectsById.get(current.parentId);
            }
        });

        return projects.filter(p => visibleProjectIds.has(p.id));
    }, [projects, currentUser]);

    return { projects: visibleProjects, isLoading, isError };
};

export const useManpowerRecordsForCurrentUser = () => {
    const { data: records = [], isLoading, isError } = useQuery({ queryKey: ['manpowerRecords'], queryFn: api.fetchManpowerRecords });
    const { projects: projectsForCurrentUser } = useProjectsForCurrentUser();
    const currentUser = useStore(state => state.currentUser);

    const visibleRecords = useMemo(() => {
        if (!records) return [];
        if (!currentUser || currentUser.role === 'Admin' || !currentUser.assignedProjects || currentUser.assignedProjects.length === 0) {
            return records;
        }
        const visibleProjectIds = new Set(projectsForCurrentUser.map(p => p.id));
        return records.filter(r => visibleProjectIds.has(r.project));
    }, [currentUser, records, projectsForCurrentUser]);

    return { records: visibleRecords, isLoading, isError };
};
  
export const useProgressRecordsForCurrentUser = () => {
    const { data: progressRecords = [], isLoading, isError } = useQuery({ queryKey: ['progressRecords'], queryFn: api.fetchProgressRecords });
    const { projects: projectsForCurrentUser } = useProjectsForCurrentUser();
    const currentUser = useStore(state => state.currentUser);

    const visibleProgressRecords = useMemo(() => {
        if (!progressRecords) return [];
        if (!currentUser || currentUser.role === 'Admin' || !currentUser.assignedProjects || currentUser.assignedProjects.length === 0) {
            return progressRecords;
        }
        const visibleProjectIds = new Set(projectsForCurrentUser.map(p => p.id));
        return progressRecords.filter(r => visibleProjectIds.has(r.activityId));
    }, [currentUser, progressRecords, projectsForCurrentUser]);

    return { progressRecords: visibleProgressRecords, isLoading, isError };
};

export const useEquipmentRecordsForCurrentUser = () => {
    const { data: equipmentRecords = [], isLoading, isError } = useQuery({ queryKey: ['equipmentRecords'], queryFn: api.fetchEquipmentRecords });
    const { projects: projectsForCurrentUser } = useProjectsForCurrentUser();
    const currentUser = useStore(state => state.currentUser);

    const visibleEquipmentRecords = useMemo(() => {
        if (!equipmentRecords) return [];
        if (!currentUser || currentUser.role === 'Admin' || !currentUser.assignedProjects || currentUser.assignedProjects.length === 0) {
            return equipmentRecords;
        }
        const visibleProjectIds = new Set(projectsForCurrentUser.map(p => p.id));
        return equipmentRecords.filter(r => visibleProjectIds.has(r.project));
    }, [currentUser, equipmentRecords, projectsForCurrentUser]);

    return { equipmentRecords: visibleEquipmentRecords, isLoading, isError };
};

export const useSafetyViolationsForCurrentUser = () => {
    const { data: violations = [], isLoading, isError } = useQuery({ queryKey: ['safetyViolations'], queryFn: api.fetchSafetyViolations });
    const { projects: projectsForCurrentUser } = useProjectsForCurrentUser();
    const currentUser = useStore(state => state.currentUser);

    const visibleViolations = useMemo(() => {
        if (!violations) return [];
        if (!currentUser || currentUser.role === 'Admin' || !currentUser.assignedProjects || currentUser.assignedProjects.length === 0) {
            return violations;
        }
        const visibleProjectIds = new Set(projectsForCurrentUser.map(p => p.id));
        return violations.filter(v => visibleProjectIds.has(v.projectId));
    }, [currentUser, violations, projectsForCurrentUser]);

    return { violations: visibleViolations, isLoading, isError };
};