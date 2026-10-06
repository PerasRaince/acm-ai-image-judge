import { supabase } from './supabaseClient';
import {
  Competition,
  Submission,
  Score,
  LeaderboardData,
  UserProfile
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export const apiClient = {
  async getMe(): Promise<UserProfile | null> {
    const headers = await getAuthHeaders();
    if (!headers['Authorization']) return null;

    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data.user;
  },

  async syncProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}/auth/sync-profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update profile');
    }
    const json = await res.json();
    return json.data;
  },

  async listCompetitions(params?: { status?: string; organizer_id?: string }): Promise<Competition[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.organizer_id) query.append('organizer_id', params.organizer_id);

    const res = await fetch(`${API_BASE_URL}/competitions?${query.toString()}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch competitions');
    }
    const json = await res.json();
    return json.data;
  },

  async getCompetition(id: string): Promise<Competition> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/competitions/${id}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch competition');
    }
    const json = await res.json();
    return json.data;
  },

  async createCompetition(formData: FormData): Promise<Competition> {
    const headers = await getAuthHeaders();
    // Do not set Content-Type header when sending FormData (browser sets boundary)
    const res = await fetch(`${API_BASE_URL}/competitions`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create competition');
    }
    const json = await res.json();
    return json.data;
  },

  async updateCompetition(id: string, data: Partial<Competition>): Promise<Competition> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update competition');
    }
    const json = await res.json();
    return json.data;
  },

  async joinCompetition(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/competitions/${id}/join`, {
      method: 'POST',
      headers
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to join competition');
    }
  },

  async submitRecreation(competitionId: string, formData: FormData): Promise<{ submission: Submission; score: Score }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/submissions`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to submit recreation');
    }
    const json = await res.json();
    return json.data;
  },

  async getLeaderboard(competitionId: string): Promise<LeaderboardData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/leaderboard`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch leaderboard');
    }
    const json = await res.json();
    return json.data;
  },

  async listSubmissions(params?: { competition_id?: string; participant_id?: string }): Promise<Submission[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.competition_id) query.append('competition_id', params.competition_id);
    if (params?.participant_id) query.append('participant_id', params.participant_id);

    const res = await fetch(`${API_BASE_URL}/submissions?${query.toString()}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch submissions');
    }
    const json = await res.json();
    return json.data;
  },

  async getSubmission(id: string): Promise<Submission> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/submissions/${id}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch submission');
    }
    const json = await res.json();
    return json.data;
  }
};
