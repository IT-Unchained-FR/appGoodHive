export type AddFundsModalProps = {
  jobId: string;
  open: boolean;
  type: string;
  onClose: VoidFunction;
  onSubmit: (amount: number, type: string) => void;
  currencyToken: string;
  currencyLabel: string;
};
