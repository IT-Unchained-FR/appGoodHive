import { useState } from "react";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import ApprovalPopup from "./ApprovalPopup";
import moment from "moment";

interface UserTableProps {
  users: ProfileData[];
  fetchData: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function UserTable({
  users,
  fetchData,
  loading,
  setLoading,
}: UserTableProps) {
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);

  const handleApproveClick = (user: ProfileData) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const handleCancelApprove = () => {
    setShowApprovePopup(false);
    setSelectedUser(null);
  };
  console.log(users[0]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Talent</TableHead>
            <TableHead>Mentor</TableHead>
            <TableHead>Recruiter</TableHead>
            <TableHead>Approved Roles</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, i) => (
            <TableRow key={i} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.talent ? "Yes" : "No"}</TableCell>
              <TableCell>{user.mentor ? "Yes" : "No"}</TableCell>
              <TableCell>{user.recruiter ? "Yes" : "No"}</TableCell>
              <TableCell>
                {user.approved_roles?.map((role: any, index) => {
                  return (
                    <div key={index}>
                      {role.role.charAt(0).toUpperCase() + role.role.slice(1)} (
                      {moment(role.approved_at).format("DD MMM YYYY")})
                    </div>
                  );
                })}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      window.open(`/admin/talent/${user?.user_id}`, "_blank");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View Profile
                  </Button>
                  <Button
                    onClick={() => handleApproveClick(user)}
                    variant="default"
                    size="sm"
                  >
                    Approve
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser as ProfileData}
          fetchData={fetchData}
          setLoading={setLoading}
          loading={loading}
        />
      )}
    </>
  );
}
