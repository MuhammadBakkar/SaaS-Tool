export type GoogleUser = {
  googleId: string;
  accessToken: string;
  refreshToken: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
};
