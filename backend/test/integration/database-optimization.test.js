/**
 * Database Performance and Pagination Integration Tests
 * Tests the optimized queries and pagination system
 */

const { expect } = require('chai');
const { processDBRequest } = require('../../src/utils');
const { 
  parsePaginationParams, 
  parseSortingParams, 
  buildPaginatedResponse 
} = require('../../src/utils/pagination');

describe('Database Optimization Tests', () => {
  
  // Test database connection
  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const { rows } = await processDBRequest({ 
        query: 'SELECT NOW() as current_time' 
      });
      
      console.log('✓ Database connection successful');
      expect(rows).to.have.lengthOf(1);
      expect(rows[0]).to.have.property('current_time');
    });
  });

  // Test pagination utilities
  describe('Pagination Utilities', () => {
    it('should parse pagination parameters with defaults', () => {
      const params = parsePaginationParams({}, { defaultLimit: 10, maxLimit: 100 });
      
      expect(params.page).to.equal(1);
      expect(params.limit).to.equal(10);
      expect(params.offset).to.equal(0);
    });

    it('should parse custom pagination parameters', () => {
      const params = parsePaginationParams(
        { page: '3', limit: '20' },
        { defaultLimit: 10, maxLimit: 100 }
      );
      
      expect(params.page).to.equal(3);
      expect(params.limit).to.equal(20);
      expect(params.offset).to.equal(40);
    });

    it('should enforce max limit', () => {
      const params = parsePaginationParams(
        { page: '1', limit: '999' },
        { defaultLimit: 10, maxLimit: 100 }
      );
      
      expect(params.limit).to.equal(100);
    });

    it('should build paginated response with metadata', () => {
      const mockData = [
        { id: 1, name: 'Student 1' },
        { id: 2, name: 'Student 2' },
      ];
      
      const response = buildPaginatedResponse(mockData, 1, 10, 25);
      
      expect(response).to.have.property('data');
      expect(response).to.have.property('pagination');
      expect(response.pagination.currentPage).to.equal(1);
      expect(response.pagination.totalPages).to.equal(3);
      expect(response.pagination.hasNextPage).to.equal(true);
    });
  });

  // Test optimized student queries
  describe('Optimized Student Queries', () => {
    it('should query students with pagination', async () => {
      const page = 1;
      const limit = 10;
      const offset = 0;
      
      const { rows } = await processDBRequest({
        query: `
          SELECT 
            u.id,
            u.name,
            u.email,
            p.class_name
          FROM users u
          INNER JOIN user_profiles p ON u.id = p.user_id
          WHERE u.role_id = 3
          ORDER BY u.id ASC
          LIMIT $1 OFFSET $2
        `,
        queryParams: [limit, offset]
      });
      
      console.log(`✓ Found ${rows.length} students on page ${page}`);
      expect(Array.isArray(rows)).to.equal(true);
    });

    it('should count total students', async () => {
      const { rows } = await processDBRequest({
        query: `
          SELECT COUNT(*) as total
          FROM users u
          INNER JOIN user_profiles p ON u.id = p.user_id
          WHERE u.role_id = 3
        `
      });
      
      const total = parseInt(rows[0].total, 10);
      console.log(`✓ Total students: ${total}`);
      expect(typeof total).to.equal('number');
    });

    it('should execute parallel queries', async () => {
      const startTime = Date.now();
      
      const [studentsResult, countResult] = await Promise.all([
        processDBRequest({
          query: 'SELECT id, name FROM users WHERE role_id = $1 LIMIT 10',
          queryParams: [3]
        }),
        processDBRequest({
          query: 'SELECT COUNT(*) as total FROM users WHERE role_id = $1',
          queryParams: [3]
        })
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✓ Parallel queries completed in ${duration}ms`);
      expect(duration).to.be.below(1000);
    });
  });

  // Performance benchmarks
  describe('Performance Benchmarks', () => {
    it('should benchmark query performance', async () => {
      const iterations = 5;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await processDBRequest({
          query: 'SELECT id, name FROM users WHERE role_id = $1 LIMIT 10',
          queryParams: [3]
        });
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`\n✓ Average query time: ${avgTime.toFixed(2)}ms (${iterations} iterations)`);
      expect(avgTime).to.be.below(300);
    });
  });
});
