// frontend/src/pages/ManageOrganizations.jsx
import { useState, useEffect } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token: authToken } = useAuth();

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/owner/organizations",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setOrganizations(res.data.organizations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <OwnerLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Manage Elections</h1>

        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-5 px-8">ID</th>
                <th className="text-left py-5 px-8">Name</th>
                <th className="text-left py-5 px-8">Email</th>
                <th className="text-left py-5 px-8">Number</th>
                <th className="text-left py-5 px-8">Password</th>
                <th className="text-left py-5 px-8">Action</th>
                <th className="text-left py-5 px-8">Status</th>
                <th className="text-left py-5 px-8">Crt_at</th>
                <th className="text-left py-5 px-8">Upd_at</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="py-5 px-8">{org.id}</td>
                  <td className="py-5 px-8 font-medium">{org.name}</td>
                  <td className="py-5 px-8">{org.email}</td>
                  <td className="py-5 px-8">{org.phone || "—"}</td>
                  <td className="py-5 px-8">••••••••</td>
                  <td className="py-5 px-8">Edit / Delete</td>
                  <td className="py-5 px-8">
                    <span
                      className={`px-4 py-1 rounded-full text-sm ${org.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-5 px-8 text-sm text-gray-500">
                    {new Date(org.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default ManageOrganizations;
