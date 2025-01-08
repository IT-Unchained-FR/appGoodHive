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
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/app/components/Spinner/Spinner";
import { ProfileData } from "@/app/talents/my-profile/page";
import Image from "next/image";
import ApprovalPopup from "../talent-approval/components/ApprovalPopup";
import { ConfirmationPopup } from "@/app/components/ConfirmationPopup/ConfirmationPopup";

export default function AdminManageTalents() {
  const [talents, setTalents] = useState<ProfileData[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<ProfileData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Approval popup state
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchAllTalents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/talents");
      const { talents } = await response.json();
      setTalents(talents);
      setFilteredTalents(talents);
    } catch (error) {
      console.log("💥", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTalents();
  }, []);

  useEffect(() => {
    const filtered = talents?.filter((talent) => {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${talent.first_name} ${talent.last_name}`.toLowerCase();
      return (
        talent.email?.toLowerCase().includes(searchLower) ||
        talent.user_id?.toLowerCase().includes(searchLower) ||
        talent.wallet_address?.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });
    setFilteredTalents(filtered || []);
    setCurrentPage(1);
  }, [searchQuery, talents]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTalents = filteredTalents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleDeleteTalent = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/talents/${userId}`, {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete talent");
      }

      toast.success("Talent deleted successfully");
      setShowDeleteConfirm(false);
      await fetchAllTalents();
    } catch (error) {
      console.error("Error deleting talent:", error);
      toast.error("Failed to delete talent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6">
      <ConfirmationPopup
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => userToDelete && handleDeleteTalent(userToDelete)}
        title="Delete Talent"
        description="Are you sure you want to delete this talent? This action cannot be undone."
        loading={loading}
      />
      {selectedUser && (
        <ApprovalPopup
          open={showApprovePopup}
          setOpen={setShowApprovePopup}
          user={selectedUser as ProfileData}
          fetchData={fetchAllTalents}
          setLoading={setLoading}
          loading={loading}
          superView
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            All Talents Under GoodHive's System
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredTalents.length} talents
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative bg-white rounded-lg">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, wallet address, or user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table className="bg-white rounded-lg max-h-[75vh] p-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Talent Name</TableHead>
              <TableHead className="w-[14%]">User ID</TableHead>
              <TableHead className="w-[15%]">Email</TableHead>
              <TableHead className="w-[12%]">Wallet Address</TableHead>
              <TableHead className="w-[8%]">Talent Status</TableHead>
              <TableHead className="w-[8%]">Mentor Status</TableHead>
              <TableHead className="w-[8%]">Recruiter Status</TableHead>
              <TableHead className="w-[8%]">Account Status</TableHead>
              <TableHead className="w-[12%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Spinner />
                </TableCell>
              </TableRow>
            ) : currentTalents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No talents found
                </TableCell>
              </TableRow>
            ) : (
              currentTalents.map((talent) => (
                <TableRow key={talent.user_id}>
                  <TableCell className="w-[15%]">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-12 w-12">
                        {talent.image_url ? (
                          <Image
                            src={talent.image_url}
                            alt={`${talent.first_name} ${talent.last_name}`}
                            width={46}
                            height={46}
                            className="h-12 w-12"
                          />
                        ) : (
                          <AvatarFallback>
                            {talent.first_name?.[0]}
                            {talent.last_name?.[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>
                        {`${talent.first_name} ${talent.last_name}`.length > 30
                          ? `${talent.first_name} ${talent.last_name}`.slice(
                              0,
                              27,
                            ) + "..."
                          : `${talent.first_name} ${talent.last_name}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[14%]">
                    <div className="flex items-center gap-2">
                      <span className="truncate]">
                        {talent.user_id
                          ? `${talent.user_id.slice(0, 5)}.......${talent.user_id.slice(-5)}`
                          : ""}
                      </span>
                      <div className="relative group">
                        <button
                          title="Copy user ID"
                          onClick={() => {
                            navigator.clipboard.writeText(talent.user_id || "");
                            toast.success("User ID copied!");
                          }}
                          className="hover:text-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded p-2 whitespace-nowrap">
                          {talent.user_id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">{talent.email}</TableCell>
                  <TableCell className="w-[12%]">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[100px]">
                        {talent.wallet_address || (
                          <Badge className={`bg-orange-500 text-white`}>
                            Not Available
                          </Badge>
                        )}
                      </span>
                      {talent.wallet_address && (
                        <button
                          title="Copy wallet address"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              talent.wallet_address || "",
                            );
                            console.log(talent.wallet_address, "Clicked Copy");
                            toast.success("Wallet address copied!");
                          }}
                          className="hover:text-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[8%]">
                    <Badge
                      className={`${
                        talent.talent === true
                          ? "bg-green-500"
                          : "bg-orange-500"
                      } text-white`}
                    >
                      {talent.talent ? <Check /> : <X />}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[8%]">
                    <Badge
                      className={`${
                        talent.mentor === true
                          ? "bg-green-500"
                          : "bg-orange-500"
                      } text-white`}
                    >
                      {talent.mentor ? <Check /> : <X />}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[8%]">
                    <Badge
                      className={`${
                        talent.recruiter === true
                          ? "bg-green-500"
                          : "bg-orange-500"
                      } text-white`}
                    >
                      {talent.recruiter ? <Check /> : <X />}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[8%]">
                    <Badge
                      className={`${
                        talent.approved ? "bg-green-500" : "bg-orange-500"
                      } text-white`}
                    >
                      {talent.approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[16%] text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit talent"
                        onClick={() => {
                          setSelectedUser(talent);
                          setShowApprovePopup(true);
                        }}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete talent"
                        onClick={() => {
                          setUserToDelete(talent.user_id || "");
                          setShowDeleteConfirm(true);
                        }}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => {
                          window.open(
                            `/talents/admin-view/${talent.user_id}`,
                            "_blank",
                          );
                        }}
                      >
                        Talent Profile
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(indexOfLastItem, filteredTalents.length)}
          </span>{" "}
          of <span className="font-medium">{filteredTalents.length}</span>{" "}
          results
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
