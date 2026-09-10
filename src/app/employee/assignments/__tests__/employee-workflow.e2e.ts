/**
 * Phase 5C Browser E2E Tests - Actual Employee Workflow
 * Tests real browser interactions using Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 5C - Employee Workflow', () => {
  // Create test data before running tests
  test.beforeAll(async () => {
    // Seed test data
    const response = await fetch('http://localhost:3001/api/dev/seed', {
      method: 'POST',
    });
    expect(response.ok).toBeTruthy();
  });

  test('Employee Login & Dashboard Redirect', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login as employee
    await page.fill('input[placeholder*="Username"]', 'employee_test');
    await page.fill('input[type="password"]', 'employee123456');
    await page.click('button:has-text("Masuk")');
    
    // Wait for navigation
    await page.waitForURL('**/employee/dashboard');
    
    // Verify employee dashboard loads
    await expect(page).toHaveURL(/\/employee\/dashboard/);
    await expect(page.locator('text=Dashboard Petugas Verifikasi')).toBeVisible();
  });

  test('Employee Dashboard Shows Employee-Specific Content', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[placeholder*="Username"]', 'employee_test');
    await page.fill('input[type="password"]', 'employee123456');
    await page.click('button:has-text("Masuk")');
    await page.waitForURL('**/employee/dashboard');
    
    // Verify employee-specific content
    await expect(page.locator('text=Total Penugasan')).toBeVisible();
    await expect(page.locator('text=Menunggu Verifikasi')).toBeVisible();
    await expect(page.locator('text=Sudah Diverifikasi')).toBeVisible();
    
    // Verify "Mulai Pencocokan Baru" does NOT exist
    await expect(page.locator('text=Mulai Pencocokan Baru')).not.toBeVisible();
  });

  test('Employee Navigation Only Shows Employee Items', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[placeholder*="Username"]', 'employee_test');
    await page.fill('input[type="password"]', 'employee123456');
    await page.click('button:has-text("Masuk")');
    await page.waitForURL('**/employee/dashboard');
    
    // Check sidebar navigation
    const sidebar = page.locator('aside');
    
    // SHOULD have employee items
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Penugasan Saya')).toBeVisible();
    await expect(sidebar.locator('text=Log Keluar')).toBeVisible();
    
    // SHOULD NOT have superadmin items
    await expect(sidebar.locator('text=Manajemen Pengguna')).not.toBeVisible();
    await expect(sidebar.locator('text=Manajemen Dataset')).not.toBeVisible();
    await expect(sidebar.locator('text=Pencocokan Data')).not.toBeVisible();
    await expect(sidebar.locator('text=Assignment')).not.toBeVisible();
    await expect(sidebar.locator('text=Monitoring Progres')).not.toBeVisible();
    await expect(sidebar.locator('text=Hasil Matching')).not.toBeVisible();
    await expect(sidebar.locator('text=Riwayat Proses')).not.toBeVisible();
  });

  test('Employee Assignment List & Detail Routing', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[placeholder*="Username"]', 'employee_test');
    await page.fill('input[type="password"]', 'employee123456');
    await page.click('button:has-text("Masuk")');
    await page.waitForURL('**/employee/dashboard');
    
    // Click Penugasan Saya
    await page.click('text=Penugasan Saya');
    await page.waitForURL('**/employee/assignments');
    
    // Verify assignment list page
    await expect(page.locator('text=Penugasan Verifikasi')).toBeVisible();
    
    // If assignments exist, click one
    const assignmentButton = page.locator('button:has-text("Record A")').first();
    if (await assignmentButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Get the assignment URL before clicking
      const href = await assignmentButton.locator('..').getAttribute('onclick');
      
      await assignmentButton.click();
      
      // Wait for detail page to load
      await page.waitForURL(/\/employee\/assignments\/\d+/, { timeout: 5000 });
      
      // Verify NO 404
      await expect(page.locator('text=This page could not be found')).not.toBeVisible();
      
      // Verify detail page content
      await expect(page.locator('text=Record A') || page.locator('text=Informasi Penugasan')).toBeVisible();
    }
  });

  test('Employee Cannot Access Superadmin Routes', async ({ page, context }) => {
    // Login as employee
    await page.goto('/login');
    await page.fill('input[placeholder*="Username"]', 'employee_test');
    await page.fill('input[type="password"]', 'employee123456');
    await page.click('button:has-text("Masuk")');
    await page.waitForURL('**/employee/dashboard');
    
    // Try to access /superadmin/dashboard
    await page.goto('/superadmin/dashboard', { waitUntil: 'networkidle' });
    
    // Should either be redirected or show error
    const url = page.url();
    const isRedirected = !url.includes('/superadmin/dashboard');
    const hasError = await page.locator('text=Akses ditolak').isVisible().catch(() => false);
    
    expect(isRedirected || hasError).toBeTruthy();
  });

  test('Cross-Employee Assignment Access Denied', async ({ browser }) => {
    // Create two browser contexts for two employees
    const emp1Context = await browser.newContext();
    const emp1Page = await emp1Context.newPage();
    
    const emp2Context = await browser.newContext();
    const emp2Page = await emp2Context.newPage();
    
    try {
      // Employee 1 login
      await emp1Page.goto('/login');
      await emp1Page.fill('input[placeholder*="Username"]', 'employee_test');
      await emp1Page.fill('input[type="password"]', 'employee123456');
      await emp1Page.click('button:has-text("Masuk")');
      await emp1Page.waitForURL('**/employee/dashboard');
      
      // Get employee 1's assignment ID by checking the API directly
      const emp1Cookie = (await emp1Context.cookies()).find(c => c.name.includes('auth') || c.name.includes('session'));
      
      if (emp1Cookie) {
        const assignRes = await emp1Page.request.get('/api/assignments/my');
        const assignments = await assignRes.json();
        
        if (assignments.data && assignments.data.length > 0) {
          const assignmentId = assignments.data[0].id;
          
          // Employee 2 login (use admin account for different user)
          await emp2Page.goto('/login');
          await emp2Page.fill('input[placeholder*="Username"]', 'admin');
          await emp2Page.fill('input[type="password"]', 'admin123456');
          await emp2Page.click('button:has-text("Masuk")');
          await emp2Page.waitForURL('**/superadmin/dashboard');
          
          // Employee 2 try to access Employee 1's assignment via API
          const deniedRes = await emp2Page.request.get(`/api/assignments/${assignmentId}`);
          
          // Should be denied (not 200)
          expect([400, 403, 404]).toContain(deniedRes.status());
        }
      }
    } finally {
      await emp1Context.close();
      await emp2Context.close();
    }
  });

  test('Superadmin Still Has Access to Superadmin Features', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123456');
    await page.click('button:has-text("Masuk")');
    
    // Should redirect to superadmin dashboard
    await page.waitForURL('**/superadmin/dashboard', { timeout: 10000 });
    
    // Verify admin sees superadmin dashboard
    const url = page.url();
    expect(url).toContain('/superadmin/dashboard');
  });
});
