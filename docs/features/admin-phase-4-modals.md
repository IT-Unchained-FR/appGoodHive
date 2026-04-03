# Admin Panel Phase 4 — Modals, Forms & Detail Pages

**Codex prompt:** "Implement all tasks in `docs/features/admin-phase-4-modals.md`. Read the file fully before starting. Run `pnpm lint && pnpm tsc --noEmit` after completing all tasks."

**Requires:** Phase 1 and Phase 2 complete first.

---

## Design principles for this phase

All modals and forms must follow these rules:

```
Dialog max-width:         sm:max-w-[480px] for simple modals, sm:max-w-[600px] for forms
Dialog content:           p-0 (remove default padding, handle it per-section)
Modal header:             px-6 pt-6 pb-4, border-b border-gray-100
  - Icon in tinted box (same palette as StatCard) + title text
  - Subtitle/description in text-sm text-gray-400 below title
Modal body:               px-6 py-4, space-y-4
Modal footer:             px-6 pb-6 pt-4, border-t border-gray-100
  - Cancel: variant="outline" rounded-xl
  - Primary: bg-[#FFC905] text-black rounded-xl (approve) OR variant="destructive" rounded-xl (reject/delete)
  - Full width on mobile: flex flex-col-reverse sm:flex-row gap-2

Section grouping inside forms:
  - Use bg-gray-50 rounded-xl p-4 to visually separate sections
  - Section heading: text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3

Input styling (all inputs/textareas):
  - h-10 rounded-lg border-gray-200 text-sm focus:ring-[#FFC905] focus:border-[#FFC905]
  - Label: text-xs font-medium text-gray-500 mb-1 block

Switch rows:
  - flex items-center justify-between py-2.5
  - Label left: text-sm font-medium text-gray-700 + optional description text-xs text-gray-400
  - Switch right (shadcn Switch component, no changes to logic)

Warning/info boxes:
  - Approve: bg-amber-50 border border-amber-100 rounded-xl p-3
  - Reject/Delete: bg-red-50 border border-red-100 rounded-xl p-3
  - Icon: h-4 w-4 mt-0.5 flex-shrink-0
  - Text: text-xs leading-relaxed

Entity info block (show who is being acted on at top of modal):
  - bg-gray-50 rounded-xl p-3 flex items-center gap-3
  - Avatar: 36px circle, bg-[#FFC905], initials in font-bold text-sm
  - Name: text-sm font-semibold text-gray-900
  - Email or subtitle: text-xs text-gray-400

Responsive:
  - All grid-cols-2 inside modals must be grid-cols-1 sm:grid-cols-2
  - Dialog itself is always full-width on mobile (shadcn handles this)
  - Footer buttons stack on mobile: flex-col-reverse sm:flex-row
```

---

## MODAL-001 — ApprovalPopup redesign [HIGHEST PRIORITY]

**File:** `app/admin/talent-approval/components/ApprovalPopup.tsx`

**Current problems:**
- No talent info shown — you don't know WHO you're approving
- Plain `<Button onClick={handleApprove}>Approve</Button>` with no reject option
- No visual separation between role toggles
- Warning box is fine but could be tighter
- `sm:max-w-[425px]` is too narrow

**Target design:**

```
┌────────────────────────────────────────┐
│ ✓ Approve Talent              [×close] │
│ Grant platform access for this talent  │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐   │
│ │ [AV] Felipe Garcia               │   │  ← entity info block
│ │      felipe@email.com            │   │
│ └──────────────────────────────────┘   │
│                                        │
│ SELECT ROLES TO APPROVE                │  ← section label
│ ┌──────────────────────────────────┐   │
│ │ Talent           [Applied] [ ◉ ] │   │
│ │ Approve as a talent on GoodHive  │   │
│ │ ──────────────────────────────── │   │
│ │ Mentor                     [ ○ ] │   │
│ │ ──────────────────────────────── │   │
│ │ Recruiter                  [ ○ ] │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ⚠ This grants platform access…        │  ← warning box
├────────────────────────────────────────┤
│ [Cancel]              [✓ Approve]      │
└────────────────────────────────────────┘
```

**What to change (logic stays identical, only UI):**

1. Change `DialogContent className` to `"sm:max-w-[480px] p-0"`

2. Replace `DialogHeader` with a styled header section:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-gray-100">
  <div className="flex items-center gap-3 mb-1">
    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    </div>
    <DialogTitle className="text-base font-bold text-gray-900">Approve Talent</DialogTitle>
  </div>
  <p className="text-xs text-gray-400 ml-11">Grant platform access for the selected roles</p>
</div>
```
Import `CheckCircle2` from lucide-react.

3. Add entity info block at the top of the body, showing user name + email (these are available on the `user` prop: `user.first_name`, `user.last_name`, `user.email`):
```tsx
<div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
  <div className="w-9 h-9 bg-[#FFC905] rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-xs font-bold text-black">
      {(user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")}
    </span>
  </div>
  <div className="min-w-0">
    <p className="text-sm font-semibold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
    <p className="text-xs text-gray-400 truncate">{user.email ?? ""}</p>
  </div>
</div>
```

4. Wrap the three switch rows in a section container:
```tsx
<div>
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Select roles to approve</p>
  <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
    {/* Talent row */}
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Talent</p>
        <p className="text-xs text-gray-400">
          {user.talent && !superView ? "Applied for this role" : "Approve as a talent"}
        </p>
      </div>
      <Switch checked={approvalTypes.talent} onCheckedChange={() => handleApprovalChange("talent")} />
    </div>
    {/* Mentor row */}
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Mentor</p>
        <p className="text-xs text-gray-400">
          {user.mentor && !superView ? "Applied for this role" : "Approve as a mentor"}
        </p>
      </div>
      <Switch checked={approvalTypes.mentor} onCheckedChange={() => handleApprovalChange("mentor")} />
    </div>
    {/* Recruiter row */}
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Recruiter</p>
        <p className="text-xs text-gray-400">
          {user.recruiter && !superView ? "Applied for this role" : "Approve as a recruiter"}
        </p>
      </div>
      <Switch checked={approvalTypes.recruiter} onCheckedChange={() => handleApprovalChange("recruiter")} />
    </div>
  </div>
</div>
```

5. Update the warning box:
```tsx
<div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
  <p className="text-xs text-amber-800 leading-relaxed">
    This will grant the selected roles and platform access. Verify all details before confirming.
  </p>
</div>
```

6. Replace the plain `<Button onClick={handleApprove}>` with a styled footer:
```tsx
<div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2">
  <Button variant="outline" className="flex-1 rounded-xl h-10" onClick={() => setOpen(false)} disabled={loading}>
    Cancel
  </Button>
  <Button
    className="flex-1 rounded-xl h-10 bg-[#FFC905] hover:bg-[#e6b400] text-black font-semibold"
    onClick={handleApprove}
    disabled={loading}
  >
    {loading
      ? <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />Processing...</span>
      : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Approve</span>
    }
  </Button>
</div>
```

Remove the old `<Button onClick={handleApprove}>` line from the body.

**Acceptance:** Approval popup shows talent name + email at top, clean role toggle rows in grouped container, yellow approve button in footer.

---

## MODAL-002 — RejectionModal redesign [HIGH PRIORITY]

**File:** `app/components/admin/RejectionModal.tsx`

**Current problems:**
- No context showing WHO is being rejected
- Plain title with red icon — feels alarming without context
- Textarea looks default unstyled
- DialogFooter buttons too close together

**What to change:**

1. `DialogContent className` → `"sm:max-w-[460px] p-0"`

2. Replace `DialogHeader` with:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-gray-100">
  <div className="flex items-center gap-3 mb-1">
    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
      <XCircle className="h-4 w-4 text-red-500" />
    </div>
    <DialogTitle className="text-base font-bold text-gray-900">
      Reject {itemName ? `"${itemName}"` : "Application"}
    </DialogTitle>
  </div>
  <p className="text-xs text-gray-400 ml-11">This reason will be sent to the applicant</p>
</div>
```

3. Wrap form body in `<div className="px-6 py-5 space-y-4">`.

4. Style the label + textarea:
```tsx
<div className="space-y-1.5">
  <label htmlFor="rejection-reason" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
    Rejection Reason <span className="text-red-400">*</span>
  </label>
  <Textarea
    id="rejection-reason"
    value={rejectionReason}
    onChange={(e) => setRejectionReason(e.target.value)}
    placeholder="Explain why this application is being rejected. Be specific — this message is sent to the applicant."
    className="min-h-[120px] rounded-xl border-gray-200 text-sm resize-none focus:ring-[#FFC905] focus:border-[#FFC905]"
    required
  />
  <p className="text-xs text-gray-400">{rejectionReason.length}/500 characters</p>
</div>
```

5. Update warning box:
```tsx
<div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
  <p className="text-xs text-red-700 leading-relaxed">
    This action cannot be undone. The applicant will be notified with the reason above.
  </p>
</div>
```

6. Replace `<DialogFooter>` with:
```tsx
<div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2">
  <Button
    type="button"
    variant="outline"
    className="flex-1 rounded-xl h-10"
    onClick={() => { setRejectionReason(""); onOpenChange(false); }}
    disabled={loading}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    className="flex-1 rounded-xl h-10 bg-red-500 hover:bg-red-600 text-white font-semibold"
    disabled={loading || !rejectionReason.trim()}
  >
    {loading
      ? <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Rejecting...</span>
      : <span className="flex items-center gap-2"><XCircle className="h-4 w-4" />Confirm Rejection</span>
    }
  </Button>
</div>
```

**Acceptance:** Rejection modal has branded header with icon, styled textarea with character count, clear footer buttons.

---

## MODAL-003 — BulkApproval redesign [HIGH PRIORITY]

**File:** `app/components/admin/BulkApproval.tsx`

**Current problems:**
- Action selection step uses plain outline buttons — approve and reject look identical
- Role toggles section uses `border rounded-lg p-4` (cheap look)
- Raw `<textarea>` element instead of shadcn `<Textarea>`
- Footer has 3 buttons (Back + Cancel + Action) crammed together on mobile
- Indentation is inconsistent in the code

**What to change:**

1. `DialogContent className` → `"sm:max-w-[500px] p-0"`

2. Replace `DialogHeader` with:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-gray-100">
  <DialogTitle className="text-base font-bold text-gray-900">
    Bulk Action
  </DialogTitle>
  <p className="text-xs text-gray-400 mt-0.5">
    {selectedItems.length} {entityType}(s) selected
  </p>
</div>
```

3. Action selection step — replace the two plain outline buttons with visually distinct action cards:
```tsx
{!action && (
  <div className="px-6 py-5 space-y-3">
    <p className="text-sm text-gray-600">Choose an action for {selectedItems.length} selected {entityType}(s):</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => setAction("approve")}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-100 bg-green-50 hover:border-green-300 hover:bg-green-100 transition-all text-left"
      >
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Approve All</p>
          <p className="text-xs text-green-600">Grant access to all selected</p>
        </div>
      </button>
      <button
        onClick={() => setAction("reject")}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-100 bg-red-50 hover:border-red-300 hover:bg-red-100 transition-all text-left"
      >
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">Reject All</p>
          <p className="text-xs text-red-500">Decline all selected</p>
        </div>
      </button>
    </div>
  </div>
)}
```

4. Approve step — role toggles section:
```tsx
{action === "approve" && entityType === "talent" && (
  <div className="px-6 py-5 space-y-4">
    <div className="flex items-center gap-2 text-green-700">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-sm font-semibold">Approve {selectedItems.length} talent(s)</span>
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Roles to approve</p>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
        {(["talent", "mentor", "recruiter"] as const).map((role) => (
          <div key={role} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
            <Switch
              checked={approvalTypes[role]}
              onCheckedChange={(checked) => setApprovalTypes({ ...approvalTypes, [role]: checked })}
            />
          </div>
        ))}
      </div>
    </div>
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-amber-800 leading-relaxed">
        This will approve all {selectedItems.length} selected {entityType}(s). This action cannot be undone.
      </p>
    </div>
  </div>
)}
```

5. Reject step — replace raw `<textarea>` with shadcn `<Textarea>`:
```tsx
{action === "reject" && (
  <div className="px-6 py-5 space-y-4">
    <div className="flex items-center gap-2 text-red-600">
      <XCircle className="h-4 w-4" />
      <span className="text-sm font-semibold">Reject {selectedItems.length} {entityType}(s)</span>
    </div>
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">
        Rejection Reason <span className="text-red-400">*</span>
      </label>
      <Textarea
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder="Provide a reason for rejection..."
        className="min-h-[100px] rounded-xl border-gray-200 text-sm resize-none focus:ring-[#FFC905]"
      />
    </div>
    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-red-700 leading-relaxed">
        This will reject all {selectedItems.length} selected {entityType}(s). This action cannot be undone.
      </p>
    </div>
  </div>
)}
```

Add `import { Textarea } from "@/components/ui/textarea";` at the top.

6. Replace `<DialogFooter>` with:
```tsx
<div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2">
  {action && (
    <Button variant="outline" className="sm:mr-auto rounded-xl h-10" onClick={() => { setAction(null); setRejectionReason(""); }}>
      ← Back
    </Button>
  )}
  <Button variant="outline" className="rounded-xl h-10" onClick={() => onOpenChange(false)}>Cancel</Button>
  {action === "approve" && (
    <Button
      className="rounded-xl h-10 bg-[#FFC905] hover:bg-[#e6b400] text-black font-semibold"
      onClick={handleApprove}
      disabled={loading}
    >
      {loading ? "Approving..." : `Approve ${selectedItems.length}`}
    </Button>
  )}
  {action === "reject" && (
    <Button
      className="rounded-xl h-10 bg-red-500 hover:bg-red-600 text-white font-semibold"
      onClick={handleReject}
      disabled={loading || !rejectionReason.trim()}
    >
      {loading ? "Rejecting..." : `Reject ${selectedItems.length}`}
    </Button>
  )}
</div>
```

**Acceptance:** Bulk action modal shows visually distinct green/red action cards on step 1. Role toggles in grouped container. Raw textarea replaced with shadcn Textarea. Footer buttons clear and well-spaced.

---

## MODAL-004 — DeleteConfirmDialog polish [MEDIUM PRIORITY]

**File:** `app/components/admin/DeleteConfirmDialog.tsx`

This modal is already functional and has good UX logic. Minor visual polish only.

**What to change:**

1. `DialogContent className` → `"sm:max-w-[460px] p-0"`

2. Replace `DialogHeader` with:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-gray-100">
  <div className="flex items-center gap-3 mb-1">
    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
      <AlertTriangle className="h-4 w-4 text-red-500" />
    </div>
    <DialogTitle className="text-base font-bold text-gray-900">
      Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
    </DialogTitle>
  </div>
  <p className="text-xs text-red-400 ml-11">This action is permanent and cannot be undone</p>
</div>
```

3. Wrap body in `<div className="px-6 py-5 space-y-4">`.

4. Update the red info box to use `rounded-xl` and `border-red-100`:
```tsx
<div className="bg-red-50 border border-red-100 rounded-xl p-4">
  {/* keep existing content inside, no logic changes */}
</div>
```

5. Update the confirm input section:
```tsx
<div className="space-y-1.5">
  <Label htmlFor="confirm-delete" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
    Type <span className="font-mono font-bold text-gray-700">DELETE</span> to confirm
  </Label>
  <Input
    id="confirm-delete"
    value={confirmText}
    onChange={(e) => setConfirmText(e.target.value)}
    placeholder="DELETE"
    className="font-mono rounded-xl border-gray-200 h-10 focus:ring-red-300 focus:border-red-300"
    disabled={loading}
  />
</div>
```

6. Replace `<DialogFooter>` with:
```tsx
<div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2">
  <Button variant="outline" className="flex-1 rounded-xl h-10" onClick={() => handleOpenChange(false)} disabled={loading}>
    Cancel
  </Button>
  <Button
    className="flex-1 rounded-xl h-10 bg-red-500 hover:bg-red-600 text-white font-semibold"
    onClick={handleConfirm}
    disabled={confirmText.toLowerCase() !== "delete" || loading}
  >
    {loading ? "Deleting..." : "Delete Permanently"}
  </Button>
</div>
```

---

## MODAL-005 — EditTalentModal redesign [HIGH PRIORITY]

**File:** `app/components/admin/EditTalentModal.tsx`

**Current problems:**
- `grid-cols-2` not responsive — breaks on mobile
- No section grouping — all fields jumbled together
- Plain labels, no visual hierarchy
- Switch rows at the bottom have no visual grouping

**What to change:**

1. `DialogContent className` → `"max-w-2xl max-h-[90vh] overflow-y-auto p-0"`

2. Replace `DialogHeader` with:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
  <div className="flex items-center gap-3 mb-1">
    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
      <UserCheck className="h-4 w-4 text-blue-600" />
    </div>
    <DialogTitle className="text-base font-bold text-gray-900">Edit Talent</DialogTitle>
  </div>
  {talent && (
    <p className="text-xs text-gray-400 ml-11">{talent.first_name} {talent.last_name} · {talent.email}</p>
  )}
</div>
```
Import `UserCheck` from lucide-react.

3. Wrap form body in `<div className="px-6 py-5 space-y-6">`.

4. Group fields into labelled sections using this pattern:
```tsx
{/* Section header */}
<div>
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Information</p>
  <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* First Name, Last Name */}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Email, Title */}
    </div>
    <div>
      {/* Description textarea */}
    </div>
  </div>
</div>
```

Group the fields as follows:
- **Personal Information**: First Name, Last Name, Email, Title, Description, Country, City
- **Contact**: Phone Country Code, Phone Number
- **Professional**: Min Rate, Max Rate, Skills, About Work
- **Social Links**: LinkedIn, GitHub, Twitter, Portfolio, Telegram, StackOverflow
- **Roles & Status**: Approved Status, Talent, Mentor, Recruiter toggles (keep in bg-gray-50 rounded-xl)

5. Update ALL `<Label>` elements to use:
```tsx
<label className="text-xs font-medium text-gray-500 mb-1 block">{label text}</label>
```

6. Update ALL `<Input>` elements to add:
```tsx
className="h-10 rounded-lg border-gray-200 text-sm"
```

7. Update the roles/toggles section:
```tsx
<div>
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Roles & Status</p>
  <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
    {[
      { id: "approved", label: "Approved Status", desc: "User has been approved on the platform", key: "approved" },
      { id: "talent", label: "Talent Role", desc: "Can apply for jobs as a talent", key: "talent" },
      { id: "mentor", label: "Mentor Role", desc: "Can mentor other users", key: "mentor" },
      { id: "recruiter", label: "Recruiter Role", desc: "Can post and manage job listings", key: "recruiter" },
    ].map(({ id, label, desc, key }) => (
      <div key={id} className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
        <Switch
          id={id}
          checked={(formData as any)[key] || false}
          onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })}
        />
      </div>
    ))}
  </div>
</div>
```

8. Replace `<DialogFooter>` with:
```tsx
<div className="px-6 pb-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white flex flex-col-reverse sm:flex-row gap-2">
  <Button type="button" variant="outline" className="flex-1 rounded-xl h-10" onClick={() => onOpenChange(false)}>
    Cancel
  </Button>
  <Button type="submit" className="flex-1 rounded-xl h-10 bg-[#FFC905] hover:bg-[#e6b400] text-black font-semibold" disabled={loading}>
    {loading ? "Saving..." : "Save Changes"}
  </Button>
</div>
```

**Acceptance:** Modal has sticky header + footer, grouped sections with section labels, responsive 2-col grids, role toggles in clean grouped container.

---

## MODAL-006 — EditCompanyModal polish [MEDIUM PRIORITY]

**File:** `app/components/admin/EditCompanyModal.tsx`

Apply the same treatment as EditTalentModal:

1. `DialogContent className` → `"max-w-2xl max-h-[90vh] overflow-y-auto p-0"`
2. Styled header with Building2 icon (blue tint), showing company name + email as subtitle
3. Body `px-6 py-5 space-y-6`
4. Group fields:
   - **Company Information**: Designation, Email, Headline, Address, City, Country
   - **Contact**: Phone Country Code, Phone Number
   - **Social Links**: LinkedIn, GitHub, Twitter, Telegram, Portfolio, StackOverflow, Wallet Address
   - **Status**: Approved, Published, In Review toggles in `bg-gray-50 rounded-xl`
5. All `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
6. All inputs: `h-10 rounded-lg border-gray-200 text-sm`
7. Sticky header + footer, footer has Cancel + Save Changes (yellow)

---

## PAGE-001 — Talent Detail Page redesign [HIGH PRIORITY]

**File:** `app/admin/talent/[user_id]/page.tsx`

**Current problems:**
- Yellow gradient header (`bg-gradient-to-r from-yellow-300 to-yellow-500`) looks dated
- Single-column `max-w-3xl mx-auto` layout wastes screen space on desktop
- Skills section is commented out (lines 132–143) — should be shown
- Action History card is buried at the bottom with no easy access
- No quick-action buttons (Approve/Reject) directly on the page

**Target layout (2-column on desktop, stacked on mobile):**
```
┌─────────────────────────────────────────────────────┐
│  WHITE TOPBAR (from AdminPageLayout)                │
├──────────────────────────┬──────────────────────────┤
│  LEFT (lg:col-span-2)    │  RIGHT (lg:col-span-1)  │
│                          │                          │
│  Profile Hero Card       │  Quick Actions Card      │
│  (avatar + name +        │  [✓ Approve]             │
│   status badge +         │  [✗ Reject]              │
│   title + location)      │  [✎ Edit]                │
│                          │                          │
│  About / Bio Card        │  Contact Info Card       │
│                          │  (email, phone,          │
│  Skills Card             │   linkedin, telegram)    │
│                          │                          │
│  Work Details Card       │  Action History Card     │
│  (rate, availability,    │                          │
│   freelance/remote)      │                          │
│                          │                          │
│  CV Card                 │                          │
└──────────────────────────┴──────────────────────────┘
```

**Specific changes:**

1. Change outer layout to 3-column grid:
```tsx
<AdminPageLayout title={`${user.first_name} ${user.last_name}`} subtitle="Talent Profile" breadcrumbLabels={breadcrumbLabels}>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
    {/* Left: spans 2 cols */}
    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
      {/* Profile hero, bio, skills, work details, CV */}
    </div>
    {/* Right: 1 col */}
    <div className="space-y-4 sm:space-y-6">
      {/* Quick actions, contact, action history */}
    </div>
  </div>
</AdminPageLayout>
```

2. Replace the yellow gradient header with a clean Profile Hero Card:
```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0">
      {user.image_url
        ? <Image src={user.image_url} alt={...} width={72} height={72} className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover" />
        : <div className="w-16 h-16 rounded-2xl bg-[#FFC905] flex items-center justify-center text-xl font-bold text-black">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
      }
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
          <p className="text-sm text-gray-500">{user.title || "No title"}</p>
        </div>
        {/* Status badge using the standard badge pattern from Phase 2 */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isApprovedTalent ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {isApprovedTalent ? "Approved" : "Pending Review"}
        </span>
      </div>
      {user.country && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <MapPin className="h-3 w-3" />
          {user.city ? `${user.city}, ` : ""}{user.country}
        </div>
      )}
    </div>
  </div>
</div>
```

3. Add Quick Actions card on the right column:
```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Actions</p>
  <div className="space-y-2">
    {!isApprovedTalent && (
      <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(255,201,5,0.12)] text-[#8a6d00] text-sm font-semibold hover:bg-[rgba(255,201,5,0.2)] transition-colors">
        <CheckCircle className="h-4 w-4" />Approve Talent
      </button>
    )}
    <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
      <XCircle className="h-4 w-4" />Reject
    </button>
    <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200">
      <Pencil className="h-4 w-4" />Edit Profile
    </button>
  </div>
</div>
```
Import `Pencil` from lucide-react. These buttons are UI-only in this phase — wire them to the existing modals/actions from `talent-approval` if those are available, otherwise leave as visual placeholders.

4. Unhide the skills section (currently commented out lines 132–143). Wrap in a card:
```tsx
{user.skills && (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Skills</p>
    <div className="flex flex-wrap gap-2">
      {String(user.skills).split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
        <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {skill}
        </span>
      ))}
    </div>
  </div>
)}
```

5. Move all other info into cards using the standard `bg-white rounded-2xl border border-gray-100 shadow-sm p-5` wrapper with `p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3"` section labels.

**Acceptance:** Talent detail page uses 2-column layout on desktop, stacked on mobile. No yellow gradient. Skills visible. Quick actions in right column.

---

## PAGE-002 — Settings Page redesign [MEDIUM PRIORITY]

**File:** `app/admin/settings/page.tsx`

**Current problems:**
- `Database` and `Mail` icons imported but never used (delete them)
- Card sections look generic — just shadcn Card defaults
- Switch rows need more visual breathing room
- Save button is floating below cards with no clear relationship to the form

**What to change:**

1. Remove unused imports: `Database` and `Mail` from the lucide-react import line.

2. Update each settings Card to use the production card style:
```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
  <div className="flex items-center gap-3 mb-5">
    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
      <Bell className="h-4 w-4 text-blue-600" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
      <p className="text-xs text-gray-400">Control email and alert preferences</p>
    </div>
  </div>
  <div className="divide-y divide-gray-50">
    {/* Switch rows */}
  </div>
</div>
```

Use these icon/color combos per section:
- Notifications → `Bell`, blue
- System → `Settings`, purple
- Security → `Shield`, orange

3. Update all switch rows:
```tsx
<div className="flex items-center justify-between py-3.5">
  <div>
    <p className="text-sm font-medium text-gray-800">{label}</p>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
  <Switch checked={value} onCheckedChange={onChange} />
</div>
```

Add descriptions to each toggle:
- Email Notifications → "Receive email alerts for platform activity"
- Approval Alerts → "Get notified when new approvals are pending"
- Weekly Reports → "Receive a summary report every Monday"
- Error Alerts → "Get alerts when system errors occur"
- Maintenance Mode → "Temporarily disable public access to the platform"
- Allow Registrations → "Allow new users to sign up"
- Require Email Verification → "New accounts must verify their email"

4. Style the security inputs (Session Timeout, Max Login Attempts):
```tsx
<div className="flex items-center justify-between py-3.5">
  <div>
    <p className="text-sm font-medium text-gray-800">Session Timeout</p>
    <p className="text-xs text-gray-400">Minutes of inactivity before admin is logged out</p>
  </div>
  <Input
    type="number"
    value={securitySettings.sessionTimeout}
    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
    className="w-20 h-9 text-center rounded-lg border-gray-200 text-sm"
  />
</div>
```

5. Move Save button into a sticky bottom bar:
```tsx
<div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-4 flex justify-end">
  <Button
    onClick={handleSave}
    disabled={loading}
    className="rounded-xl h-10 px-6 bg-[#FFC905] hover:bg-[#e6b400] text-black font-semibold"
  >
    {loading ? "Saving..." : "Save Settings"}
  </Button>
</div>
```
Place this outside and below the `<AdminPageLayout>` body, or pass it as the `actions` prop to `AdminPageLayout`.

**Acceptance:** Settings page has card sections with icon headers, clean switch rows with descriptions, no unused imports, yellow Save button.

---

## Final checklist before marking Phase 4 complete

### Modals
- [ ] ApprovalPopup: entity info block at top, grouped role toggles, yellow Approve footer button
- [ ] RejectionModal: branded header, styled textarea with character count, red Confirm button
- [ ] BulkApproval: green/red action cards on step 1, Textarea (not raw textarea), grouped role toggles
- [ ] DeleteConfirmDialog: branded header, styled confirm input, red Delete button
- [ ] EditTalentModal: sticky header/footer, grouped sections, all grid-cols-1 sm:grid-cols-2
- [ ] EditCompanyModal: same polish as EditTalentModal

### Pages
- [ ] Talent detail: 2-column layout, no yellow gradient, skills visible, quick actions right column
- [ ] Settings: unused imports removed, card headers with icons + descriptions, switch rows with descriptions, yellow Save button

### Responsive
- [ ] All modal grids use `grid-cols-1 sm:grid-cols-2`
- [ ] All modal footers use `flex-col-reverse sm:flex-row`
- [ ] Talent detail: `grid-cols-1 lg:grid-cols-3`
- [ ] No modal content overflows on iPhone-sized screen

### Code quality
- [ ] No new `console.log` added
- [ ] No `any` types added (use existing types)
- [ ] `pnpm lint` passes
- [ ] `pnpm tsc --noEmit` passes
