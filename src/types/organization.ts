export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string | null;
}

export interface JoinCodeResponse {
  joinCode: string;
}
