"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Copy,
  Download,
  PenSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/app/components/Spinner/Spinner";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  userid: string;
  talent_status: "approved" | "pending";
  mentor_status: "approved" | "pending";
  recruiter_status: "approved" | "pending";
  wallet_address?: string;
  last_active: string;
  has_talent_profile: boolean;
}

export default function AdminManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileFilter, setProfileFilter] = useState<
    "all" | "with_profile" | "without_profile"
  >("all");

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const { users } = await response.json();
      setUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.log("💥", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.wallet_address
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          user.userid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (profileFilter === "all" ||
          (profileFilter === "with_profile" && user.has_talent_profile) ||
          (profileFilter === "without_profile" && !user.has_talent_profile)),
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users, profileFilter]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers?.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredUsers?.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Users Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredUsers?.length} users
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {/* Search and Filter Container */}
        <div className="flex gap-4 flex-col">
          {/* Filter Buttons */}
          <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 w-fit">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setProfileFilter("all")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                profileFilter === "all"
                  ? "bg-[#FFC905] text-black"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setProfileFilter("with_profile")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                profileFilter === "with_profile"
                  ? "bg-[#FFC905] text-black"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              With Profile
            </button>
            <button
              onClick={() => setProfileFilter("without_profile")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                profileFilter === "without_profile"
                  ? "bg-[#FFC905] text-black"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Without Profile
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-grow bg-white rounded-lg h-12">
            <div className="relative flex-grow bg-white rounded-lg h-12">
              <Search className="h-5 w-5 text-muted-foreground bg-white absolute left-2 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Search by email, wallet address, user ID, first name, or last name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-12"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="bg-white rounded-lg min-w-full">
          <TableHeader className="divide-y">
            <TableRow>
              <TableHead className="">Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Approved Roles</TableHead>
              <TableHead>Talent Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.email?.charAt(0) ||
                          user.wallet_address?.charAt(2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{""}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>
                      {user.wallet_address && user.wallet_address.length > 10
                        ? `${user.wallet_address.slice(0, 10)}...${user.wallet_address.slice(-10)}`
                        : user.wallet_address}
                    </span>
                    {user.wallet_address && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          toast.success("Wallet Address copied to clipboard");
                          navigator.clipboard.writeText(
                            user.wallet_address || "",
                          );
                        }}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>
                      {user.userid.length > 10
                        ? `${user.userid.slice(0, 10)}...${user.userid.slice(-10)}`
                        : user.userid}
                    </span>{" "}
                    {user.userid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          toast.success("User ID copied to clipboard");
                          navigator.clipboard.writeText(user.userid);
                        }}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.mentor_status === "approved" && (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        Mentor
                      </Badge>
                    )}
                    {user.recruiter_status === "approved" && (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        Recruiter
                      </Badge>
                    )}
                    {user.talent_status === "approved" && (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        Talent
                      </Badge>
                    )}
                    {user.mentor_status !== "approved" &&
                      user.recruiter_status !== "approved" &&
                      user.talent_status !== "approved" && (
                        <Badge className="bg-gray-500 text-white hover:bg-gray-600">
                          No Roles
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.has_talent_profile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap w-full max-w-[150px] text-white bg-[#FFC905] border border-transparent rounded-md hover:bg-[#FFC905]/80 transition duration-200 ease-in-out" // Modern design with rounded corners and transition effects
                      onClick={() => {
                        window.open(`/admin/talent/${user.userid}`, "_blank");
                      }}
                    >
                      Talent Profile
                    </Button>
                  ) : (
                    <Badge className="bg-gray-600 text-gray-200 hover:bg-gray-500 w-[150px] text-center align-middle justify-center">
                      No Talent Profile
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-[52px]">
                  <Spinner />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(indexOfLastItem, filteredUsers.length)}
          </span>{" "}
          of <span className="font-medium">{filteredUsers.length}</span> results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Go to previous page</span>
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Go to next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
