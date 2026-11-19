import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.enum(["Saltillo", "Monterrey", "Guadalajara", "Ciudad de México"]);
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("city") ?? "Saltillo");
  if (!parsed.success) return NextResponse.json({ error: "Ciudad no disponible." }, { status: 400 });
  try {
    const city = parsed.data;
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.search = new URLSearchParams({ name: city, count: "10", language: "es", format: "json" }).toString();
    const geoResponse = await fetch(geoUrl, { next: { revalidate: 86400 } });
    if (!geoResponse.ok) return NextResponse.json({ error: "No se pudo localizar la ciudad." }, { status: 502 });
    const geoData = await geoResponse.json();
    const location = geoData.results?.find((result: { country_code?: string }) => result.country_code === "MX");
    if (!location) return NextResponse.json({ error: "No hay datos disponibles para esta ciudad." }, { status: 404 });
    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m", timezone: "auto" }).toString();
    const response = await fetch(forecastUrl, { next: { revalidate: 900 } });
    if (!response.ok) return NextResponse.json({ error: "El servicio del clima no está disponible." }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ city, current: data.current, units: data.current_units, fetchedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "No se pudo consultar el clima." }, { status: 502 }); }
}
