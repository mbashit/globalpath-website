import { expect, test, type Page } from "@playwright/test";
import { admin, loadAccounts, PASSWORD } from "./accounts";

const header = (page: Page) => page.getByRole("banner");

/** Each sign-in gets its own client IP so the in-memory login throttle never trips across tests. */
async function logIn(page: Page, email: string, path = "/login") {
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
  await page.goto(path);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
}

test.describe("visitor navigation", () => {
  test("1. Create Account from the homepage opens the working signup form", async ({ page }) => {
    await page.goto("/");
    await header(page).getByRole("link", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Create your student account" })).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    // Server-side validation answers (no account is created, no email sent).
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();
  });

  test("2. Log in from a destination page opens the working login form", async ({ page }) => {
    await page.goto("/destinations/germany");
    await header(page).getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("account links appear on every public page", async ({ page }) => {
    for (const path of ["/", "/study-abroad", "/destinations", "/services", "/about", "/faqs", "/contact", "/book-consultation", "/visa-support"]) {
      await page.goto(path);
      await expect(header(page).getByRole("link", { name: "Log in" }), path).toBeVisible();
      await expect(header(page).getByRole("link", { name: "Create Account" }), path).toBeVisible();
    }
  });

  test("keyboard users can reach Log in and Create Account", async ({ page }) => {
    await page.goto("/");
    const login = header(page).getByRole("link", { name: "Log in" });
    for (let i = 0; i < 25 && !(await login.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(login).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(header(page).getByRole("link", { name: "Create Account" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("homepage introduces the student portal once", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Your Study Abroad Journey, All in One Place" })).toHaveCount(1);
    const section = page.locator("#student-portal");
    for (const c of ["Academic Profile", "Secure Document Uploads", "Document Review", "Application Tracking"]) await expect(section.getByText(c, { exact: true })).toBeVisible();
    await section.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("footer links to the student portal", async ({ page }) => {
    await page.goto("/about");
    const portal = page.getByRole("contentinfo").getByRole("navigation", { name: "Student portal" });
    await expect(portal.getByRole("link", { name: "Student Portal" })).toHaveAttribute("href", "/portal");
    await expect(portal.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    await expect(portal.getByRole("link", { name: "Create Account" })).toHaveAttribute("href", "/signup");
  });

  test("12. consultation forms stay public, no account needed", async ({ page }) => {
    for (const path of ["/book-consultation", "/contact"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByLabel("Full name"), path).toBeVisible();
    }
    // The eligibility review is free; the $40 fee applies per application in the portal.
    await page.goto("/study-abroad#eligibility");
    await expect(page.getByRole("button", { name: "Request an Eligibility Review" })).toBeVisible();
    await expect(page.getByText("Continue to Pay")).toHaveCount(0);
    await expect(page.getByText("$40 per application").first()).toBeAttached();
  });

  test("13. header and footer links all resolve", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.locator("header a[href^='/'], footer a[href^='/']").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!.split("#")[0]))]);
    expect(hrefs.length).toBeGreaterThan(15);
    for (const href of hrefs) {
      const res = await request.get(href, { maxRedirects: 0 });
      // /portal redirects visitors to /login (307); everything else must load.
      expect([200, 307], href).toContain(res.status());
    }
  });

  test("8. protected page sends visitors to login, then back to the page", async ({ page }) => {
    const { student } = loadAccounts();
    await page.goto("/portal/documents");
    await expect(page).toHaveURL(/\/login\?next=%2Fportal%2Fdocuments/);
    await expect(page.getByText("Log in or create an account to continue.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup?next=%2Fportal%2Fdocuments");
    await logIn(page, student.email, page.url());
    await expect(page).toHaveURL(/\/portal\/documents$/);
  });

  test("login ignores off-site return paths", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email, "/login?next=%2F%09%2Fexample.org");
    await expect(page).toHaveURL(/localhost:3123\/portal$/);
  });

  test("header never overflows or wraps at common widths", async ({ page }) => {
    for (const width of [320, 375, 390, 768, 1024, 1280, 1366, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/", "/study-abroad", "/login"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(0);
        const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
        expect(nav!.height, `header height ${path} @ ${width}px`).toBeLessThanOrEqual(72);
      }
    }
  });
});

test.describe("mobile menu", () => {
  test("3. @mobile account actions sit at the top of the menu", async ({ page }) => {
    await page.goto("/");
    await expect(header(page).getByRole("link", { name: "Log in" })).toBeVisible();
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.locator("#mobile-menu");
    const create = menu.getByRole("link", { name: "Create Account" });
    await expect(create).toBeFocused();
    const first = await menu.locator("a").first().textContent();
    expect(first).toBe("Create Account");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await page.getByRole("button", { name: "Open menu" }).click();
    await create.click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(menu).toBeHidden();
  });

  test("@mobile signed-in students get Dashboard in the menu", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email);
    await expect(page).toHaveURL(/\/portal$/);
    await page.goto("/services");
    await expect(header(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#mobile-menu").getByRole("link", { name: "Go to Dashboard" })).toBeVisible();
    await expect(page.locator("#mobile-menu").getByRole("link", { name: "Create Account" })).toHaveCount(0);
  });

  test("@mobile portal sidebar opens, marks the page and links back", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email, "/login?next=%2Fportal%2Fprofile");
    await expect(page).toHaveURL(/\/portal\/profile$/);
    await page.getByRole("button", { name: "Open menu" }).click();
    const sidebar = page.locator("#portal-sidebar");
    await expect(sidebar.getByRole("link", { name: "My Profile" })).toHaveAttribute("aria-current", "page");
    await sidebar.getByRole("link", { name: "Back to GlobalPath website" }).click();
    await expect(page).toHaveURL(/localhost:3123\/$/);
  });
});

test.describe("student journey", () => {
  test("4. registration verification link activates the account and opens the portal", async ({ page }) => {
    const { signup } = loadAccounts();
    // generateLink returns the verification token without sending an email.
    const { data, error } = await admin().auth.admin.generateLink({
      type: "signup",
      email: signup.email,
      password: PASSWORD,
      options: { data: { first_name: "Neo", last_name: "E2E", accepted_terms: "true" } },
    });
    expect(error).toBeNull();
    await page.goto(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=signup&next=%2Fportal`);
    await expect(page).toHaveURL(/\/portal\?notice=verified/);
    await expect(page.locator("#portal-sidebar").getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });

  test("5–7, 9, 10. log in, header switches, documents, refresh, sign out", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email);
    await expect(page).toHaveURL(/\/portal$/);

    // 6. Public header shows account links, not the visitor links.
    await page.goto("/destinations");
    await expect(header(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(header(page).getByRole("link", { name: "Log in" })).toHaveCount(0);
    await header(page).getByRole("button", { name: "My Account" }).click();
    for (const item of ["My Profile", "My Documents", "My Applications", "Verification Status", "Account Settings"]) {
      await expect(header(page).getByRole("link", { name: item })).toBeVisible();
    }
    await expect(header(page).getByRole("link", { name: "Staff dashboard" })).toHaveCount(0);

    // 7. Document area.
    await header(page).getByRole("link", { name: "My Documents" }).click();
    await expect(page).toHaveURL(/\/portal\/documents$/);
    await expect(page.locator("#portal-sidebar").getByRole("link", { name: "My Documents" })).toHaveAttribute("aria-current", "page");

    // 10. Refresh keeps the session on a protected page.
    await page.reload();
    await expect(page).toHaveURL(/\/portal\/documents$/);

    // 9. Sign out from the public header.
    await page.goto("/");
    await header(page).getByRole("button", { name: "My Account" }).click();
    await header(page).getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/login\?notice=signed-out/);
    await page.goto("/portal/documents");
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.goto("/");
    await expect(header(page).getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("no logged-out flash for a signed-in student", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email);
    await expect(page).toHaveURL(/\/portal$/);
    await page.goto("/about", { waitUntil: "commit" });
    // Before the session check finishes, visitor links must never be visible.
    await page.waitForSelector("header", { state: "attached" });
    const guestVisible = await page.evaluate(() => {
      const el = document.querySelector("header .account-guest");
      return !!el && getComputedStyle(el).visibility === "visible";
    });
    expect(guestVisible).toBe(false);
    await expect(header(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("signed-in header fits at common widths", async ({ page }) => {
    const { student } = loadAccounts();
    await logIn(page, student.email);
    await expect(page).toHaveURL(/\/portal$/);
    for (const width of [320, 375, 768, 1024, 1280, 1366, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      if (width >= 360) await expect(header(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
      else await expect(header(page).getByRole("link", { name: "Dashboard" })).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `@ ${width}px`).toBeLessThanOrEqual(0);
      const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
      expect(nav!.height, `header height @ ${width}px`).toBeLessThanOrEqual(72);
      const consult = header(page).getByRole("link", { name: "Request a Consultation" });
      if (await consult.isVisible()) expect((await consult.boundingBox())!.height, `consultation link wraps @ ${width}px`).toBeLessThanOrEqual(44);
    }
  });

  test("11. staff need MFA for /admin; students cannot open it", async ({ page }) => {
    const { staff, student } = loadAccounts();
    await logIn(page, student.email);
    await expect(page).toHaveURL(/\/portal$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/portal$/);
    await page.goto("/admin/students");
    await expect(page).toHaveURL(/\/portal$/);

    await page.context().clearCookies();
    await logIn(page, staff.email);
    await expect(page).toHaveURL(/\/login\/mfa\?next=%2Fadmin/);
    await page.goto("/admin/students");
    await expect(page).toHaveURL(/\/login\/mfa/);
    // The header offers the staff link (the server still enforces MFA on /admin).
    await page.goto("/");
    await header(page).getByRole("button", { name: "My Account" }).click();
    await expect(header(page).getByRole("link", { name: "Staff dashboard" })).toBeVisible();
  });
});
