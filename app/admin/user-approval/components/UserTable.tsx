import { ProfileData } from "@/app/talents/my-profile/page";
import { User } from "../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: ProfileData[];
  onProfileClick: (user: ProfileData) => void;
}

export function UserTable({ users, onProfileClick }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Talent</TableHead>
          <TableHead>Mentor</TableHead>
          <TableHead>Recruiter</TableHead>
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
            <TableCell className="text-right">
              <Button
                onClick={() => onProfileClick(user)}
                variant="outline"
                size="sm"
              >
                View Profile
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
