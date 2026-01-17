import { api } from '@/api';

export interface Certificate {
  id: string;
  studentAddress: string;
  studentName: string;
  studentEmail: string;
  certificateType: string;
  ipfsHash: string;
  issuedAt: string;
  issuedBy: string;
  revoked: boolean;
  metadata?: {
    certificateData?: {
      studentName: string;
      studentEmail: string;
      certificateType: string;
      achievement: string;
      issuedDate: string;
      issuer: string;
      institution: string;
    };
  };
  ipfsUrl?: string;
}

export interface IssueCertificateRequest {
  studentId: string;
  certificateType: string;
  achievement: string;
  additionalInfo?: Record<string, any>;
}

export interface CertificateStats {
  initialized: boolean;
  totalCertificates: string;
  network?: string;
  contractAddress?: string;
}

export const certificatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    issueCertificate: builder.mutation<any, IssueCertificateRequest>({
      query: (data) => ({
        url: '/api/v1/certificates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Certificate'],
    }),

    verifyCertificate: builder.query<{ success: boolean; valid: boolean; data?: Certificate }, string>({
      query: (certificateId) => `/api/v1/certificates/verify/${certificateId}`,
    }),

    getCertificate: builder.query<{ success: boolean; data: Certificate }, string>({
      query: (certificateId) => `/api/v1/certificates/details/${certificateId}`,
      providesTags: (result, error, id) => [{ type: 'Certificate', id }],
    }),

    getStudentCertificates: builder.query<{ success: boolean; data: Certificate[] }, string>({
      query: (studentId) => `/api/v1/certificates/student/${studentId}`,
      providesTags: (result, error, id) => [{ type: 'Certificate', id: `student-${id}` }],
    }),

    revokeCertificate: builder.mutation<any, string>({
      query: (certificateId) => ({
        url: `/api/v1/certificates/${certificateId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Certificate', id }],
    }),

    getCertificateStats: builder.query<{ success: boolean; data: CertificateStats }, void>({
      query: () => '/api/v1/certificates/stats',
    }),
  }),
  overrideExisting: false,
});

export const {
  useIssueCertificateMutation,
  useVerifyCertificateQuery,
  useLazyVerifyCertificateQuery,
  useGetCertificateQuery,
  useGetStudentCertificatesQuery,
  useRevokeCertificateMutation,
  useGetCertificateStatsQuery,
} = certificatesApi;
