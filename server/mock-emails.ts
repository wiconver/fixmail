export interface MockEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  sizeEstimate: number;
  labelIds: string[];
  category: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toUTCString();
}

function today(): string {
  return new Date().toUTCString();
}

const SEED_EMAILS: MockEmail[] = [
  { id: "mock_001", from: "ofertas@amazon.es", subject: "¡Flash Sale! 60% OFF en electrónica - Solo hoy", date: today(), snippet: "Aprovecha las mejores ofertas del año en televisores, portátiles y más. Tiempo limitado.", sizeEstimate: 42000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_002", from: "newsletter@medium.com", subject: "10 artículos de tecnología que debes leer esta semana", date: daysAgo(1), snippet: "Esta semana en Medium: IA generativa, el futuro de los LLMs, y por qué Rust está ganando...", sizeEstimate: 28000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_003", from: "noreply@netflix.com", subject: "Tu resumen mensual de Netflix", date: daysAgo(2), snippet: "En marzo viste 12 horas de contenido. Te recomendamos: The Crown Temporada 6...", sizeEstimate: 35000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_004", from: "security@google.com", subject: "Alerta de seguridad: nuevo acceso a tu cuenta", date: today(), snippet: "Hemos detectado un nuevo inicio de sesión desde Madrid, España. ¿Fuiste tú?", sizeEstimate: 18000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_005", from: "info@linkedin.com", subject: "José García vio tu perfil", date: daysAgo(1), snippet: "José García, Director de Ingeniería en Telefónica, visitó tu perfil de LinkedIn.", sizeEstimate: 22000, labelIds: ["INBOX", "CATEGORY_SOCIAL"], category: "Social" },
  { id: "mock_006", from: "ofertas@elcorteingles.es", subject: "CYBER MONDAY - Descuentos de hasta el 70%", date: today(), snippet: "Las mejores marcas con los mejores precios. Ropa, hogar, tecnología y mucho más.", sizeEstimate: 55000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_007", from: "noreply@github.com", subject: "[PR #247] Fix: Authentication middleware timeout issue", date: daysAgo(3), snippet: "miguelog opened a pull request: This PR fixes the race condition in the auth middleware...", sizeEstimate: 31000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_008", from: "hello@substack.com", subject: "Tech Weekly: ChatGPT sigue sorprendiendo a la industria", date: daysAgo(4), snippet: "En esta edición: OpenAI anuncia GPT-5, Meta presenta Llama 3, y Google... lanza Gemini Ultra.", sizeEstimate: 48000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_009", from: "no-reply@spotify.com", subject: "Tu nuevo mix de los martes está listo", date: daysAgo(1), snippet: "Hemos creado una mezcla personalizada basada en tu historial de escucha. ¡Escúchala ahora!", sizeEstimate: 24000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_010", from: "facturas@vodafone.es", subject: "Tu factura de febrero ya está disponible", date: daysAgo(10), snippet: "Importe total: 49,90€. Fecha de cargo: 05/03/2026. Descárgala desde Mi Vodafone.", sizeEstimate: 19000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_011", from: "newsletter@hackernews.com", subject: "Hacker News Weekly Digest", date: daysAgo(5), snippet: "Top stories: 1. Linus Torvalds on AI coding tools 2. PostgreSQL 17 released 3. Cloudflare...", sizeEstimate: 62000, labelIds: ["INBOX", "CATEGORY_FORUMS"], category: "Forums" },
  { id: "mock_012", from: "marketing@booking.com", subject: "¡Escapada de primavera! Hoteles desde 39€/noche", date: today(), snippet: "Las mejores opciones para tu próximo viaje. Cancela gratis hasta 24h antes.", sizeEstimate: 71000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_013", from: "notifications@twitter.com", subject: "Nueva actividad en tu cuenta de X", date: daysAgo(2), snippet: "@techgeek123 retwitteó tu publicación sobre Rust. +47 nuevos seguidores esta semana.", sizeEstimate: 16000, labelIds: ["INBOX", "CATEGORY_SOCIAL"], category: "Social" },
  { id: "mock_014", from: "support@openai.com", subject: "Tu suscripción ChatGPT Plus se renovará el 15/03", date: daysAgo(3), snippet: "Tu plan ChatGPT Plus de 20$/mes se renovará automáticamente. Para cancelar, ve a...", sizeEstimate: 21000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_015", from: "promo@zara.com", subject: "Nueva colección primavera-verano 2026 ya disponible", date: daysAgo(1), snippet: "Descubre los nuevos diseños de la temporada. Envío gratuito en pedidos superiores a 30€.", sizeEstimate: 88000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_016", from: "digest@stackoverflow.com", subject: "Stack Overflow: Tus mejores respuestas de la semana", date: daysAgo(6), snippet: "Tu respuesta sobre TypeScript generics obtuvo 142 votos. ¡Sigue así!", sizeEstimate: 33000, labelIds: ["INBOX", "CATEGORY_FORUMS"], category: "Forums" },
  { id: "mock_017", from: "info@airbnb.es", subject: "Carlos valora tu próxima estancia en Barcelona", date: daysAgo(2), snippet: "Tu reserva del 20-25 de abril está confirmada. El anfitrión Carlos tiene una puntuación de 4.9.", sizeEstimate: 27000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_018", from: "newsletter@elconfidencial.com", subject: "Las noticias que más importan esta mañana", date: today(), snippet: "Bolsa al alza: el IBEX35 sube un 1.2%. El Gobierno aprueba el presupuesto para 2027...", sizeEstimate: 44000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_019", from: "promo@pccomponentes.com", subject: "⚡ Ofertas flash: RTX 5080 con 200€ de descuento", date: today(), snippet: "Stock limitado. NVIDIA GeForce RTX 5080 16GB por solo 899€. Envío en 24h.", sizeEstimate: 39000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_020", from: "digest@reddit.com", subject: "r/programming - Posts más populares de la semana", date: daysAgo(3), snippet: "1. 'I built a compiler from scratch in Rust' - 8.2k upvotes. 2. Go 2.0 release candidate...", sizeEstimate: 52000, labelIds: ["INBOX", "CATEGORY_FORUMS"], category: "Forums" },
  { id: "mock_021", from: "no-reply@paypal.com", subject: "Confirmación de pago: 12,99€ a Adobe Systems", date: daysAgo(8), snippet: "Has realizado un pago de 12,99€ a Adobe Systems S.L. el 23/02/2026. Referencia: 7X2B9K.", sizeEstimate: 17000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_022", from: "newsletter@hubspot.com", subject: "Marketing Trends 2026: Lo que debes saber", date: daysAgo(7), snippet: "IA en marketing, personalización a escala, y el fin de las cookies de terceros. Descarga el informe.", sizeEstimate: 45000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_023", from: "ofertas@mediamarkt.es", subject: "Liquidación total: hasta 40% en iPhone 16 y Samsung S25", date: daysAgo(1), snippet: "¡No te pierdas estas ofertas! Financiación sin intereses disponible. Solo en tienda física y online.", sizeEstimate: 67000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_024", from: "noreply@trello.com", subject: "Tienes 3 tarjetas vencidas en tu tablero", date: daysAgo(2), snippet: "Las siguientes tarjetas han pasado su fecha límite: 'Revisar PR #234', 'Actualizar docs', 'Sprint review'", sizeEstimate: 20000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_025", from: "team@figma.com", subject: "Ana López te invitó a colaborar en 'App Redesign Q1'", date: daysAgo(1), snippet: "Tienes acceso para editar el proyecto 'App Redesign Q1'. Haz clic para unirte al equipo.", sizeEstimate: 23000, labelIds: ["INBOX", "CATEGORY_SOCIAL"], category: "Social" },
  { id: "mock_026", from: "news@typeform.com", subject: "5 formas de mejorar tus formularios con IA", date: daysAgo(14), snippet: "Descubre cómo la inteligencia artificial está transformando la manera de recopilar datos...", sizeEstimate: 38000, labelIds: ["INBOX", "CATEGORY_UPDATES"], category: "Updates" },
  { id: "mock_027", from: "ofertas@vueling.com", subject: "✈️ Vuela a Roma por solo 49€ ida y vuelta", date: today(), snippet: "Bilbao - Roma Fiumicino. Vuelos disponibles del 15 al 30 de abril. ¡Reserva ya antes de que se agoten!", sizeEstimate: 43000, labelIds: ["INBOX", "CATEGORY_PROMOTIONS"], category: "Promotions" },
  { id: "mock_028", from: "noreply@vercel.com", subject: "Deploy exitoso: mi-app-prod (commit: a3f2b1c)", date: daysAgo(1), snippet: "Tu aplicación se ha desplegado correctamente en producción. URL: https://mi-app.vercel.app", sizeEstimate: 14000, labelIds: ["INBOX"], category: "Primary" },
  { id: "mock_029", from: "digest@producthunt.com", subject: "🏆 Los 5 productos del día en Product Hunt", date: daysAgo(4), snippet: "1. FixMail - AI Gmail Cleaner #1 del día! 2. Notion AI 3.0 3. Figma Slides...", sizeEstimate: 56000, labelIds: ["INBOX", "CATEGORY_FORUMS"], category: "Forums" },
  { id: "mock_030", from: "marketing@canva.com", subject: "Tus diseños más populares del mes", date: daysAgo(5), snippet: "3 de tus diseños obtuvieron más de 500 vistas. ¡Sigue creando con Canva Pro!", sizeEstimate: 31000, labelIds: ["INBOX", "CATEGORY_SOCIAL"], category: "Social" },
];

let mockEmailsState: MockEmail[] = [...SEED_EMAILS];

export function getMockEmails(): MockEmail[] {
  return mockEmailsState;
}

export function deleteMockEmails(ids: string[]): number {
  const before = mockEmailsState.length;
  mockEmailsState = mockEmailsState.filter((e) => !ids.includes(e.id));
  return before - mockEmailsState.length;
}

export function searchMockEmails(params: { q?: string; after?: string; before?: string }): MockEmail[] {
  let result = [...mockEmailsState];
  if (params.q) {
    const q = params.q.toLowerCase();
    result = result.filter(
      (e) =>
        e.from.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q)
    );
  }
  if (params.after) {
    const afterDate = new Date(params.after);
    result = result.filter((e) => new Date(e.date) >= afterDate);
  }
  if (params.before) {
    const beforeDate = new Date(params.before);
    result = result.filter((e) => new Date(e.date) <= beforeDate);
  }
  return result;
}

export function getMockStats() {
  const emails = getMockEmails();
  const categoryCounts = {
    Primary: emails.filter((e) => e.category === "Primary").length,
    Promotions: emails.filter((e) => e.category === "Promotions").length,
    Social: emails.filter((e) => e.category === "Social").length,
    Updates: emails.filter((e) => e.category === "Updates").length,
    Forums: emails.filter((e) => e.category === "Forums").length,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const promotionsToday = emails.filter(
    (e) => e.category === "Promotions" && new Date(e.date) >= today
  ).length;

  return {
    categories: Object.entries(categoryCounts).map(([label, count]) => ({ label, count })),
    totalMessages: emails.length + 1840,
    storageUsed: 3200000000,
    promotionsToday,
  };
}

export function deleteMockPromotionsToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toDelete = mockEmailsState
    .filter((e) => e.category === "Promotions" && new Date(e.date) >= today)
    .map((e) => e.id);
  return deleteMockEmails(toDelete);
}

export function deleteMockBySender(sender: string): number {
  const toDelete = mockEmailsState
    .filter((e) => e.from.toLowerCase().includes(sender.toLowerCase()))
    .map((e) => e.id);
  return deleteMockEmails(toDelete);
}

export function isDemo(): boolean {
  return !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
}
