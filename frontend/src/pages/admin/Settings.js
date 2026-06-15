import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { resolveWhatsAppUrl } from '../../utils/whatsapp';

const WHATSAPP_SETTING_KEYS = [
  'whatsapp_support_contact',
  'whatsapp_support_enabled',
  'whatsapp_new_users_contact',
  'whatsapp_new_users_enabled',
  'whatsapp_official_contact',
  'whatsapp_official_enabled'
];

const WhatsAppTierCard = ({
  title,
  description,
  borderClass,
  contact,
  onContactChange,
  enabled,
  onEnabledChange,
  enabledLabel,
  onSave,
  saving
}) => {
  const preview = resolveWhatsAppUrl(contact);

  return (
    <div className={`bg-white rounded-lg shadow p-6 mb-6 border-l-4 ${borderClass}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp link or phone number
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => onContactChange(e.target.value)}
            placeholder="https://chat.whatsapp.com/... or +231771234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366]"
          />
          {preview && (
            <p className="text-xs text-gray-500 mt-1 break-all">Preview: {preview}</p>
          )}
          {!contact.trim() && (
            <p className="text-xs text-amber-600 mt-1">Leave empty to remove this link from the app.</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="rounded"
          />
          {enabledLabel}
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [newUsersContact, setNewUsersContact] = useState('');
  const [newUsersEnabled, setNewUsersEnabled] = useState(true);
  const [officialContact, setOfficialContact] = useState('');
  const [officialEnabled, setOfficialEnabled] = useState(true);
  const [supportContact, setSupportContact] = useState('');
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const getSettingValue = (list, key, fallback = '') =>
    list.find((s) => s.key === key)?.value ?? fallback;

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get('/admin/settings');
      const list = res.data.data.settings || [];
      setSettings(list);
      setNewUsersContact(getSettingValue(list, 'whatsapp_new_users_contact'));
      setNewUsersEnabled(getSettingValue(list, 'whatsapp_new_users_enabled') !== 'false');
      setOfficialContact(getSettingValue(list, 'whatsapp_official_contact'));
      setOfficialEnabled(getSettingValue(list, 'whatsapp_official_enabled') !== 'false');
      setSupportContact(getSettingValue(list, 'whatsapp_support_contact'));
      setSupportEnabled(getSettingValue(list, 'whatsapp_support_enabled') !== 'false');
    } catch (error) {
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key, value) => {
    await axios.put(`/admin/settings/${key}`, { value });
  };

  const validateContact = (contact) => {
    const trimmed = contact.trim();
    if (trimmed && !resolveWhatsAppUrl(trimmed)) {
      toast.error('Enter a valid WhatsApp invite link or phone number.');
      return false;
    }
    return true;
  };

  const saveTier = async (tierKey, contact, enabled, contactKey, enabledKey) => {
    if (!validateContact(contact)) return;

    setSavingKey(tierKey);
    try {
      await updateSetting(contactKey, contact.trim());
      await updateSetting(enabledKey, enabled ? 'true' : 'false');
      toast.success('WhatsApp settings updated — live across the app within a minute');
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update WhatsApp settings');
    } finally {
      setSavingKey(null);
    }
  };

  const startEditing = (setting) => {
    setEditingKey(setting.key);
    setTempValue(setting.value || '');
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setTempValue('');
  };

  const handleSave = async (key) => {
    try {
      await updateSetting(key, tempValue);
      toast.success('Setting updated successfully');
      setEditingKey(null);
      setTempValue('');
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update setting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const groupedSettings = settings
    .filter((setting) => !WHATSAPP_SETTING_KEYS.includes(setting.key))
    .reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(setting);
      return acc;
    }, {});

  const categories = Object.keys(groupedSettings);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure platform-wide settings and parameters</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Groups & Support</h2>
        <p className="text-sm text-gray-600">
          Changes apply in real time (users see updates within about a minute, or immediately on refresh).
        </p>
      </div>

      <WhatsAppTierCard
        title="New Users Chatroom"
        description="Shown on the dashboard after register/login for users who have not made an approved deposit yet."
        borderClass="border-blue-500"
        contact={newUsersContact}
        onContactChange={setNewUsersContact}
        enabled={newUsersEnabled}
        onEnabledChange={setNewUsersEnabled}
        enabledLabel="Show new-user chatroom link on dashboard"
        saving={savingKey === 'new'}
        onSave={() => saveTier(
          'new',
          newUsersContact,
          newUsersEnabled,
          'whatsapp_new_users_contact',
          'whatsapp_new_users_enabled'
        )}
      />

      <WhatsAppTierCard
        title="Official Group (Active Users)"
        description="Shown on the dashboard after a user has at least one approved deposit and an active account."
        borderClass="border-emerald-600"
        contact={officialContact}
        onContactChange={setOfficialContact}
        enabled={officialEnabled}
        onEnabledChange={setOfficialEnabled}
        enabledLabel="Show official group link for depositors"
        saving={savingKey === 'official'}
        onSave={() => saveTier(
          'official',
          officialContact,
          officialEnabled,
          'whatsapp_official_contact',
          'whatsapp_official_enabled'
        )}
      />

      <WhatsAppTierCard
        title="Customer Service (Floating Button)"
        description="Blinking floating WhatsApp button on every page for general customer service contact."
        borderClass="border-[#25D366]"
        contact={supportContact}
        onContactChange={setSupportContact}
        enabled={supportEnabled}
        onEnabledChange={setSupportEnabled}
        enabledLabel="Show floating customer service button"
        saving={savingKey === 'support'}
        onSave={() => saveTier(
          'support',
          supportContact,
          supportEnabled,
          'whatsapp_support_contact',
          'whatsapp_support_enabled'
        )}
      />

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold capitalize">{category.replace(/_/g, ' ')}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedSettings[category].map((setting) => (
                <div key={setting.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="font-medium text-gray-900 mb-1">{setting.key}</div>
                      {setting.description && (
                        <div className="text-sm text-gray-600 mb-2">{setting.description}</div>
                      )}
                      {editingKey === setting.key ? (
                        <div className="mt-2">
                          {setting.valueType === 'number' ? (
                            <input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          ) : setting.valueType === 'boolean' ? (
                            <select
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <textarea
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              rows={setting.valueType === 'json' ? 5 : 3}
                              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-mono text-sm"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <code className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-800">
                            {setting.valueType === 'json'
                              ? JSON.stringify(JSON.parse(setting.value || '{}'), null, 2)
                              : setting.value || '(empty)'}
                          </code>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingKey === setting.key ? (
                        <>
                          <button
                            onClick={() => handleSave(setting.key)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditing(setting)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No settings found</p>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
