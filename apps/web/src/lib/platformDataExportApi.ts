import { getSupabase } from "@/lib/supabase";

const PAGE_SIZE = 1000;

type BrandRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  marketing_theme: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

type CenterRow = {
  id: string;
  brand_id: string;
  slug: string;
  name: string;
  display_name: string | null;
  status: string;
  region: string | null;
  city: string | null;
  country: string | null;
  address_line1: string | null;
  pincode: string | null;
  contact_phone: string | null;
  short_description: string | null;
  created_at: string;
  updated_at: string;
  brands: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

type StudentRow = {
  id: string;
  brand_id: string;
  full_name: string;
  student_code: string | null;
  login_email: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
  brands: { name: string; slug: string } | { name: string; slug: string }[] | null;
  student_profiles:
    | {
        phone: string | null;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        school_name: string | null;
      }
    | {
        phone: string | null;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        school_name: string | null;
      }[]
    | null;
};

type EnrollmentRow = {
  student_id: string;
  brand_id: string;
  status: string;
  enrolled_at: string;
  ended_at: string | null;
  franchise_centers: { name: string; slug: string } | { name: string; slug: string }[] | null;
  programs: { name: string } | { name: string }[] | null;
  levels: { name: string } | { name: string }[] | null;
};

type SubscriptionRow = {
  brand_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  subscription_plans: { name: string } | { name: string }[] | null;
};

export type PlatformBrandExportRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  marketingTheme: string;
  logoUrl: string | null;
  activeCenters: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionPeriodStart: string | null;
  subscriptionPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformCenterExportRow = {
  id: string;
  brandName: string;
  brandSlug: string;
  slug: string;
  name: string;
  displayName: string | null;
  status: string;
  region: string | null;
  city: string | null;
  country: string | null;
  addressLine1: string | null;
  pincode: string | null;
  contactPhone: string | null;
  shortDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformStudentExportRow = {
  id: string;
  brandName: string;
  brandSlug: string;
  fullName: string;
  studentCode: string | null;
  loginEmail: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  schoolName: string | null;
  centerName: string | null;
  centerSlug: string | null;
  enrollmentStatus: string | null;
  programName: string | null;
  levelName: string | null;
  enrolledAt: string | null;
  enrollmentEndedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformDataExportBundle = {
  exportedAt: string;
  brands: PlatformBrandExportRow[];
  centers: PlatformCenterExportRow[];
  students: PlatformStudentExportRow[];
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export async function fetchPlatformDataExport(): Promise<PlatformDataExportBundle> {
  const sb = getSupabase();

  const [brands, centers, students, enrollments, subscriptions] = await Promise.all([
    fetchAllPages<BrandRow>((from, to) =>
      sb
        .from("brands")
        .select("id, slug, name, status, marketing_theme, logo_url, created_at, updated_at")
        .is("deleted_at", null)
        .order("name")
        .range(from, to)
    ),
    fetchAllPages<CenterRow>((from, to) =>
      sb
        .from("franchise_centers")
        .select(
          "id, brand_id, slug, name, display_name, status, region, city, country, address_line1, pincode, contact_phone, short_description, created_at, updated_at, brands(name, slug)"
        )
        .is("deleted_at", null)
        .order("name")
        .range(from, to)
    ),
    fetchAllPages<StudentRow>((from, to) =>
      sb
        .from("students")
        .select(
          "id, brand_id, full_name, student_code, login_email, date_of_birth, created_at, updated_at, brands(name, slug), student_profiles(phone, address_line1, city, state, pincode, school_name)"
        )
        .is("deleted_at", null)
        .order("full_name")
        .range(from, to)
    ),
    fetchAllPages<EnrollmentRow>((from, to) =>
      sb
        .from("student_enrollments")
        .select(
          "student_id, brand_id, status, enrolled_at, ended_at, franchise_centers(name, slug), programs(name), levels:starting_level_id(name)"
        )
        .order("enrolled_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllPages<SubscriptionRow>((from, to) =>
      sb
        .from("brand_subscriptions")
        .select("brand_id, status, current_period_start, current_period_end, subscription_plans(name)")
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
  ]);

  const centersByBrand = new Map<string, number>();
  for (const center of centers) {
    centersByBrand.set(center.brand_id, (centersByBrand.get(center.brand_id) ?? 0) + 1);
  }

  const subscriptionByBrand = new Map<string, SubscriptionRow>();
  for (const sub of subscriptions) {
    if (!subscriptionByBrand.has(sub.brand_id)) {
      subscriptionByBrand.set(sub.brand_id, sub);
    }
  }

  const enrollmentsByStudent = new Map<string, EnrollmentRow[]>();
  for (const enrollment of enrollments) {
    const list = enrollmentsByStudent.get(enrollment.student_id) ?? [];
    list.push(enrollment);
    enrollmentsByStudent.set(enrollment.student_id, list);
  }

  const brandRows: PlatformBrandExportRow[] = brands.map((brand) => {
    const sub = subscriptionByBrand.get(brand.id);
    const plan = relationOne(sub?.subscription_plans ?? null);
    return {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      status: brand.status,
      marketingTheme: brand.marketing_theme,
      logoUrl: brand.logo_url,
      activeCenters: centersByBrand.get(brand.id) ?? 0,
      subscriptionPlan: plan?.name ?? null,
      subscriptionStatus: sub?.status ?? null,
      subscriptionPeriodStart: sub?.current_period_start ?? null,
      subscriptionPeriodEnd: sub?.current_period_end ?? null,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
    };
  });

  const centerRows: PlatformCenterExportRow[] = centers.map((center) => {
    const brand = relationOne(center.brands);
    return {
      id: center.id,
      brandName: brand?.name ?? "",
      brandSlug: brand?.slug ?? "",
      slug: center.slug,
      name: center.name,
      displayName: center.display_name,
      status: center.status,
      region: center.region,
      city: center.city,
      country: center.country,
      addressLine1: center.address_line1,
      pincode: center.pincode,
      contactPhone: center.contact_phone,
      shortDescription: center.short_description,
      createdAt: center.created_at,
      updatedAt: center.updated_at,
    };
  });

  const studentRows: PlatformStudentExportRow[] = [];

  for (const student of students) {
    const brand = relationOne(student.brands);
    const profile = relationOne(student.student_profiles);
    const studentEnrollments = enrollmentsByStudent.get(student.id) ?? [];

    const base = {
      id: student.id,
      brandName: brand?.name ?? "",
      brandSlug: brand?.slug ?? "",
      fullName: student.full_name,
      studentCode: student.student_code,
      loginEmail: student.login_email,
      dateOfBirth: student.date_of_birth,
      phone: profile?.phone ?? null,
      addressLine1: profile?.address_line1 ?? null,
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      pincode: profile?.pincode ?? null,
      schoolName: profile?.school_name ?? null,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    };

    if (studentEnrollments.length === 0) {
      studentRows.push({
        ...base,
        centerName: null,
        centerSlug: null,
        enrollmentStatus: null,
        programName: null,
        levelName: null,
        enrolledAt: null,
        enrollmentEndedAt: null,
      });
      continue;
    }

    for (const enrollment of studentEnrollments) {
      const center = relationOne(enrollment.franchise_centers);
      const program = relationOne(enrollment.programs);
      const level = relationOne(enrollment.levels);
      studentRows.push({
        ...base,
        centerName: center?.name ?? null,
        centerSlug: center?.slug ?? null,
        enrollmentStatus: enrollment.status,
        programName: program?.name ?? null,
        levelName: level?.name ?? null,
        enrolledAt: enrollment.enrolled_at,
        enrollmentEndedAt: enrollment.ended_at,
      });
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    brands: brandRows,
    centers: centerRows,
    students: studentRows,
  };
}
