export interface User {
  id: number;
  name: string;
  email: string;
  requestDate: string;
  status: string;
  roles: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  };
}
