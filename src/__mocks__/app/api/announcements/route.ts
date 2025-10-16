import { NextResponse } from 'next/server';

// Mock implementations of the API route handlers
export const GET = jest.fn().mockImplementation(async () => {
  return NextResponse.json([]);
});

export const POST = jest.fn().mockImplementation(async () => {
  return NextResponse.json({}, { status: 201 });
});

export const PUT = jest.fn().mockImplementation(async () => {
  return NextResponse.json({});
});

export const DELETE = jest.fn().mockImplementation(async () => {
  return NextResponse.json({ success: true });
});
