import { useState } from 'react';
import type { SocialPostSettings } from '@scd/types';
import { useResource } from '../../lib/hooks.js';
import { apiClient } from '../../lib/api.js';
import { ResourceForm, type FieldDef, type FormValues } from '../../components/ResourceForm.js';

const FIELDS: FieldDef[] = [
  { name: 'linkedinEnabled', label: 'Allow sharing to LinkedIn', type: 'checkbox' },
  { name: 'instagramEnabled', label: 'Allow sharing to Instagram', type: 'checkbox' },
  {
    name: 'baseHashtags',
    label: 'Base hashtags',
    type: 'textlist',
    help: 'One per line, e.g. #AWSStudentCommunityDay. Added to every generated post alongside the attendee’s chosen interests.',
  },
  {
    name: 'introLines',
    label: 'Opening line variants',
    type: 'textlist',
    help: 'One per line. Use {event} for the event name. Each attendee is deterministically assigned one variant, for a bit of variety without inventing anything about them.',
  },
];

export function SocialPostSettingsPage() {
  const { data: settings, loading, error, reload } = useResource<SocialPostSettings>('/admin/content/social-post-settings');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSubmit = async (values: FormValues) => {
    setSaveError(null);
    try {
      await apiClient.patch('/admin/content/social-post-settings', values);
      setSavedAt(Date.now());
      reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
      throw err;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>"Create My SCD Post" settings</h1>
          <p className="page-description">
            Controls the shared template attendees use to generate their LinkedIn/Instagram announcement --
            hashtags, opening lines, and which platforms are offered. Doesn't touch any attendee's already-saved
            draft until they regenerate.
          </p>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {saveError && <p className="form-error">{saveError}</p>}
      {savedAt && <p className="form-success">Saved.</p>}

      {!loading && settings && (
        <div className="panel">
          <ResourceForm
            fields={FIELDS}
            initialValues={settings as unknown as FormValues}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => reload()}
          />
        </div>
      )}
    </div>
  );
}
