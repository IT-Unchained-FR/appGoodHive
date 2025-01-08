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

interface UserTableProps {
  users: ProfileData[] | any[];
  onProfileClick: (user: ProfileData) => void;
  isCompany: boolean;
  fetchData?: () => void;
}

export function UserTable({ users, isCompany, fetchData }: UserTableProps) {
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApproveClick = (user: ProfileData) => {
    setSelectedUser(user);
    setShowApprovePopup(true);
  };

  const handleConfirmApprove = async () => {
    if (selectedUser?.user_id) {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/companies/pending", {
          method: "POST",
          body: JSON.stringify({ userId: selectedUser.user_id }),
        });
        const data = await response.json();

        if (response.status !== 200) {
          throw new Error(data.message);
        }
        toast.success("Talent approved successfully");
        fetchData && fetchData();
      } catch (error) {
        toast.error("Unable to approve the talent");
      } finally {
        setLoading(false);
      }
      setShowApprovePopup(false);
      setSelectedUser(null);
    }
  };

  const handleCancelApprove = () => {
    setShowApprovePopup(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, i) => (
            <TableRow key={i} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium">
                {isCompany
                  ? `${user.designation}`
                  : `${user.first_name} ${user.last_name}`}
              </TableCell>
              <TableCell>{user.email}</TableCell>

              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {/* <Button
                    onClick={() => {
                      window.open(
                        `/admin/talent/${user?.user_id}`,
                        "_blank",
                      );
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View Profile
                  </Button> */}
                  <Button
                    onClick={() => handleApproveClick(user)}
                    variant="default"
                    size="sm"
                  >
                    Approve
                  </Button>
                  {/* <Button
                    onClick={() => handleApproveClick(user)}
                    variant="default"
                    size="sm"
                  >
                    Approve
                  </Button> */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showApprovePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Approval</h2>
            <p>Are you sure you want to approve?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={handleCancelApprove} variant="outline" size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApprove}
                variant="default"
                size="sm"
                disabled={loading}
              >
                {loading ? "Loading..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
