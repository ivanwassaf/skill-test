import { api } from '@/api';
import { Tag } from '@/api/tag-types';

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
        url: '/certificates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [Tag.CERTIFICATE],
    }),

    verifyCertificate: builder.query<{ success: boolean; valid: boolean; data?: Certificate }, string>({
      query: (certificateId) => `/certificates/verify/${certificateId}`,
    }),

    getCertificate: builder.query<{ success: boolean; data: Certificate }, string>({
      query: (certificateId) => `/certificates/details/${certificateId}`,
      providesTags: (_result, _error, id) => [{ type: Tag.CERTIFICATE, id }],
    }),

    getStudentCertificates: builder.query<{ success: boolean; data: Certificate[] }, string>({
      query: (studentId) => `/certificates/student/${studentId}`,
      providesTags: (_result, _error, id) => [{ type: Tag.CERTIFICATE, id: `student-${id}` }],
    }),

    revokeCertificate: builder.mutation<any, string>({
      query: (certificateId) => ({
        url: `/certificates/${certificateId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: Tag.CERTIFICATE, id }],
    }),

    getCertificateStats: builder.query<{ success: boolean; data: CertificateStats }, void>({
      query: () => '/certificates/stats',
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
