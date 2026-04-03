"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";

interface ReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: ReportParams) => Promise<void>;
}

interface ReportParams {
  type: "talents" | "companies" | "jobs";
  format: "csv";
  startDate?: string;
  endDate?: string;
}

export function ReportGenerator({
  open,
  onOpenChange,
  onGenerate,
}: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ReportParams>({
    type: "talents",
    format: "csv",
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await onGenerate(params);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="report-type">Report Type</Label>
            <Select
              value={params.type}
              onValueChange={(value: ReportParams["type"]) =>
                setParams({ ...params, type: value })
              }
            >
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talents">Talents Report</SelectItem>
                <SelectItem value="companies">Companies Report</SelectItem>
                <SelectItem value="jobs">Jobs Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="report-format">Format</Label>
            <Select
              value={params.format}
              onValueChange={(value: ReportParams["format"]) =>
                setParams({ ...params, format: value })
              }
            >
              <SelectTrigger id="report-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start-date">Start Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="start-date"
                  type="date"
                  value={params.startDate || ""}
                  onChange={(e) =>
                    setParams({ ...params, startDate: e.target.value })
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="end-date">End Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="end-date"
                  type="date"
                  value={params.endDate || ""}
                  onChange={(e) =>
                    setParams({ ...params, endDate: e.target.value })
                  }
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
