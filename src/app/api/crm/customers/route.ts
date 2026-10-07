import { NextResponse, type NextRequest } from "next/server";
import { createCustomer, getCustomers } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { CreateCustomerInput, CustomerStatus, CustomerType } from "@/types/customer";
import {
  validateCustomerType,
  validateCustomerName,
  validateCompanyName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateCustomerStatus,
} from "@/lib/validation/customer";

interface ParsedValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: CreateCustomerInput;
}

/**
 * Validates and sanitizes incoming untrusted JSON payload.
 * Strictly allowlists approved fields, strips forbidden attributes,
 * and normalizes empty optional strings to null.
 * Enforces mandatory customer_type, name, company_name, and status.
 */
function parseAndValidateCreateCustomerBody(raw: unknown): ParsedValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;

  // 1. Customer Type validation (required)
  const typeError = validateCustomerType(body.customer_type);
  if (typeError) {
    return { valid: false, error: typeError };
  }
  const customer_type = body.customer_type as CustomerType;

  // 2. Name validation (required, 1–255 chars)
  const nameError = validateCustomerName(body.name);
  if (nameError) {
    return { valid: false, error: nameError };
  }
  const name = (body.name as string).trim();

  // 3. Company Name (optional, max 255 chars, normalize empty/whitespace to null)
  let company_name: string | null = null;
  if ("company_name" in body && body.company_name !== null && body.company_name !== undefined) {
    if (typeof body.company_name !== "string") {
      return { valid: false, error: "Company name must be a string." };
    }
    const trimmedCompany = body.company_name.trim();
    if (trimmedCompany) {
      const companyError = validateCompanyName(trimmedCompany);
      if (companyError) {
        return { valid: false, error: companyError };
      }
      company_name = trimmedCompany;
    }
  }

  // 4. Status validation (required, 'active' | 'inactive')
  const statusError = validateCustomerStatus(body.status);
  if (statusError) {
    return { valid: false, error: statusError };
  }
  const status = body.status as CustomerStatus;

  // 5. Email (optional, max 255 chars, normalize empty to null)
  let email: string | null = null;
  if ("email" in body && body.email !== null && body.email !== undefined) {
    if (typeof body.email !== "string") {
      return { valid: false, error: "Enter a valid email address." };
    }
    const trimmedEmail = body.email.trim();
    if (trimmedEmail) {
      const emailError = validateEmail(trimmedEmail);
      if (emailError) {
        return { valid: false, error: emailError };
      }
      email = trimmedEmail;
    }
  }

  // 6. Phone (optional, max 50 chars, normalize empty to null)
  let phone: string | null = null;
  if ("phone" in body && body.phone !== null && body.phone !== undefined) {
    if (typeof body.phone !== "string") {
      return { valid: false, error: "Enter a valid phone number." };
    }
    const trimmedPhone = body.phone.trim();
    if (trimmedPhone) {
      const phoneError = validatePhone(trimmedPhone);
      if (phoneError) {
        return { valid: false, error: phoneError };
      }
      phone = trimmedPhone;
    }
  }

  // 7. Address (optional, max 500 chars, normalize empty to null)
  let address: string | null = null;
  if ("address" in body && body.address !== null && body.address !== undefined) {
    if (typeof body.address !== "string") {
      return { valid: false, error: "Address cannot exceed 500 characters." };
    }
    const trimmedAddress = body.address.trim();
    if (trimmedAddress) {
      const addressError = validateAddress(trimmedAddress);
      if (addressError) {
        return { valid: false, error: addressError };
      }
      address = trimmedAddress;
    }
  }

  // Construct pure sanitized input
  return {
    valid: true,
    data: {
      customer_type,
      name,
      company_name,
      email,
      phone,
      address,
      status,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Malformed JSON body.",
          errorCode: "INVALID_JSON",
          data: null,
        },
        { status: 400 }
      );
    }

    const validation = parseAndValidateCreateCustomerBody(rawBody);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid customer data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const createdCustomer = await createCustomer(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        errorCode: null,
        data: createdCustomer,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errorCode: error.errorCode,
          data: null,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add customer. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || undefined;
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;
    const rawPageSize = parseInt(searchParams.get("page_size") || "20", 10);
    const pageSize =
      !isNaN(rawPageSize) && rawPageSize >= 1 && rawPageSize <= 50
        ? rawPageSize
        : 20;

    const result = await getCustomers({
      page,
      pageSize,
      search,
    });

    const safeItems = result.items.map((cust) => ({
      id: cust.id,
      name: cust.name,
      company_name: cust.company_name ?? null,
    }));

    return NextResponse.json({
      success: true,
      items: safeItems,
      meta: {
        total: result.meta.total,
        page: result.meta.page,
        pageSize: result.meta.pageSize,
        totalPages: result.meta.totalPages,
      },
    });
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errorCode: error.errorCode,
          items: [],
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve customers. Please try again.",
        errorCode: "INTERNAL_ERROR",
        items: [],
      },
      { status: 500 }
    );
  }
}

