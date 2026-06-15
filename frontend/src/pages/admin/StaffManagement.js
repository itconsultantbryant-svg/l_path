import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../utils/staffConfig';

const StaffManagement = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'hop'
  });

  const fetchData = async () => {
    try {
      const [rolesRes, staffRes] = await Promise.all([
        axios.get('/admin/staff/roles'),
        axios.get('/admin/staff')
      ]);
      setRoles(rolesRes.data.data.roles || []);
      setStaff(staffRes.data.data.staff || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error('Provide email or phone for the staff account.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/admin/staff', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        roleName: form.roleName
      });
      toast.success('Staff account created');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roleName: form.roleName
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 text-center text-gray-600">
        Only administrators can manage staff positions.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Positions</h1>
      <p className="text-gray-600 mb-8">
        Create HOP, HOM, Finance, and CSM accounts. Each role gets its own dashboard and sidebar.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add Staff Member</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="firstName"
                placeholder="First name"
                value={form.firstName}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email (optional if phone provided)"
              value={form.email}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              name="phone"
              placeholder="Phone (optional if email provided)"
              value={form.phone}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            />
            <select
              name="roleName"
              value={form.roleName}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label}
                </option>
              ))}
            </select>
            <input
              name="password"
              type="password"
              placeholder="Temporary password (min 8 chars)"
              value={form.password}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              minLength={8}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Staff Account'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Staff ({staff.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3 py-2">{member.firstName} {member.lastName}</td>
                    <td className="px-3 py-2">
                      {ROLE_LABELS[member.role?.name] || member.role?.name}
                    </td>
                    <td className="px-3 py-2">{member.email || member.phone}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        member.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {member.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-3 py-8 text-center text-gray-500">
                      No staff accounts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
