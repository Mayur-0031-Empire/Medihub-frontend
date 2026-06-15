export type PublicReview = {
  _id: string;
  rating: number;
  content: string;
  hospitalName?: string;
  createdAt?: string;
  patient?: {
    firstName?: string;
    username?: string;
  };
  doctor?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  doctorProfile?: {
    hospitalName?: string;
    specialization?: string;
  };
};

export type CreateReviewPayload = {
  doctorProfileId?: string;
  hospitalName?: string;
  rating: number;
  content: string;
};

export type ContactPayload = {
  name: string;
  username: string;
  question: string;
};
