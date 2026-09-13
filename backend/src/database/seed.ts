import argon2 from "argon2"
import {
  DEFAULT_CATEGORIES,
  EventStatus,
  EventVisibility,
  OrderStatus,
  OrganizerVerificationStatus,
  PaymentStatus,
  UserRole,
} from "../types"
import { UserModel } from "../modules/users/user.model"
import { OrganizerModel } from "../modules/organizers/organizer.model"
import { VenueModel } from "../modules/venues/venue.model"
import { CategoryModel } from "../modules/categories/category.model"
import { EventModel } from "../modules/events/event.model"
import { TicketTypeModel } from "../modules/events/ticketType.model"
import { EventStaffModel } from "../modules/checkins/eventStaff.model"
import { OrderModel } from "../modules/orders/order.model"
import { PaymentModel } from "../modules/payments/payment.model"
import { recomputeEventPricing } from "../modules/events/ticketTypes.service"
import { issueTicketsForOrder } from "../modules/tickets/tickets.service"
import { logger } from "../config/logger"

const DEV_PASSWORD = "Password123!"

// NOTE: cover images below are placeholder Unsplash URLs for local development
// only. Replace with real Gabonese event photography before launch, per the
// product brief's "avoid generic stock imagery" direction.
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",
  "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=1200",
]

async function upsertUser(input: {
  name: string
  email: string
  role: UserRole
  phone?: string
}) {
  const passwordHash = await argon2.hash(DEV_PASSWORD, {
    type: argon2.argon2id,
  })
  return UserModel.findOneAndUpdate(
    { email: input.email },
    { $setOnInsert: { ...input, passwordHash } },
    { upsert: true, returnDocument: "after" },
  )
}

function daysFromNow(days: number, hour = 19): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}

export async function seedDatabase(): Promise<void> {
  const existingCategories = await CategoryModel.countDocuments()
  if (existingCategories > 0) {
    logger.info("Seed skipped: database already contains data")
    return
  }

  logger.info("Seeding development data...")

  // ---- Categories ----
  const categories = await CategoryModel.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      active: true,
    })),
  )
  const categoryBySlug = new Map<string, (typeof categories)[number]>(
    categories.map((c) => [c.slug, c]),
  )

  // ---- Dev accounts ----
  const admin = await upsertUser({
    name: "Admin Noma",
    email: "admin@noma.events",
    role: UserRole.SUPER_ADMIN,
  })
  const organizerOwner = await upsertUser({
    name: "Aïcha Moussavou",
    email: "organizer@noma.events",
    role: UserRole.ORGANIZER,
    phone: "+241 01 23 45 67",
  })
  const secondOrganizerOwner = await upsertUser({
    name: "Steeve Obiang",
    email: "organizer2@noma.events",
    role: UserRole.ORGANIZER,
    phone: "+241 01 98 76 54",
  })
  const attendee = await upsertUser({
    name: "Grace Ondo",
    email: "attendee@noma.events",
    role: UserRole.ATTENDEE,
    phone: "+241 06 11 22 33",
  })
  const staff = await upsertUser({
    name: "Junior Ngoua",
    email: "staff@noma.events",
    role: UserRole.EVENT_STAFF,
  })
  void admin

  // ---- Organizers ----
  const organizer1 = await OrganizerModel.create({
    ownerUserId: organizerOwner._id,
    name: "Libreville Live",
    slug: "libreville-live",
    description:
      "Collectif organisateur de concerts, festivals et soirées culturelles à Libreville et dans tout le Gabon.",
    logoUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
    coverUrl: PLACEHOLDER_IMAGES[0],
    contactEmail: "contact@libreville-live.ga",
    contactPhone: "+241 01 23 45 67",
    verificationStatus: OrganizerVerificationStatus.VERIFIED,
  })

  const organizer2 = await OrganizerModel.create({
    ownerUserId: secondOrganizerOwner._id,
    name: "Gabon Culture Collective",
    slug: "gabon-culture-collective",
    description:
      "Promotion des arts, du patrimoine et des expériences gastronomiques gabonaises.",
    logoUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300",
    coverUrl: PLACEHOLDER_IMAGES[1],
    contactEmail: "hello@gabonculture.ga",
    verificationStatus: OrganizerVerificationStatus.VERIFIED,
  })

  // ---- Venues ----
  const venueLibreville = await VenueModel.create({
    name: "Palais des Sports de Libreville",
    address: "Boulevard Triomphal, Libreville",
    city: "Libreville",
    country: "Gabon",
    coordinates: { lat: 0.3924, lng: 9.4536 },
    capacity: 3000,
  })
  const venueLibreville2 = await VenueModel.create({
    name: "Institut Français du Gabon",
    address: "Quartier Louis, Libreville",
    city: "Libreville",
    country: "Gabon",
    coordinates: { lat: 0.3901, lng: 9.4544 },
    capacity: 500,
  })
  const venuePortGentil = await VenueModel.create({
    name: "Centre Culturel de Port-Gentil",
    address: "Avenue du Général de Gaulle, Port-Gentil",
    city: "Port-Gentil",
    country: "Gabon",
    capacity: 800,
  })
  const venueFranceville = await VenueModel.create({
    name: "Palais Omnisports de Franceville",
    address: "Centre-ville, Franceville",
    city: "Franceville",
    country: "Gabon",
    capacity: 1200,
  })

  // ---- Events ----
  type SeedEvent = {
    organizerId: typeof organizer1._id
    venueId: typeof venueLibreville._id
    categorySlug: string
    title: string
    summary: string
    description: string
    city: string
    coverImage: string
    startInDays: number
    durationHours: number
    status: EventStatus
    ticketTypes: Array<{ name: string; priceXaf: number; quantity: number }>
  }

  const seedEvents: SeedEvent[] = [
    {
      organizerId: organizer1._id,
      venueId: venueLibreville._id,
      categorySlug: "musique",
      title: "Nuit Afro-Urbaine Libreville",
      summary:
        "Une soirée électrique avec les meilleurs artistes afro-urbains du moment.",
      description:
        "Rejoignez-nous pour une nuit inoubliable de musique afro-urbaine avec des artistes locaux et régionaux. DJ sets, live performances et une ambiance électrique vous attendent au Palais des Sports.",
      city: "Libreville",
      coverImage: PLACEHOLDER_IMAGES[0],
      startInDays: 21,
      durationHours: 6,
      status: EventStatus.PUBLISHED,
      ticketTypes: [
        { name: "Standard", priceXaf: 10000, quantity: 400 },
        { name: "VIP", priceXaf: 25000, quantity: 100 },
      ],
    },
    {
      organizerId: organizer2._id,
      venueId: venueLibreville2._id,
      categorySlug: "culture-patrimoine",
      title: "Festival du Patrimoine Gabonais",
      summary:
        "Danses traditionnelles, artisanat et gastronomie locale à l'honneur.",
      description:
        "Le Festival du Patrimoine Gabonais célèbre la richesse culturelle du Gabon à travers des spectacles de danse traditionnelle, des expositions d'artisanat et une dégustation gastronomique.",
      city: "Libreville",
      coverImage: PLACEHOLDER_IMAGES[1],
      startInDays: 14,
      durationHours: 8,
      status: EventStatus.PUBLISHED,
      ticketTypes: [{ name: "Entrée Gratuite", priceXaf: 0, quantity: 1000 }],
    },
    {
      organizerId: organizer2._id,
      venueId: venueLibreville2._id,
      categorySlug: "comedie-divertissement",
      title: "Soirée Stand-up Libreville Rit",
      summary:
        "Les meilleurs humoristes gabonais réunis pour une soirée de rire.",
      description:
        "Libreville Rit revient avec une programmation exceptionnelle d'humoristes locaux et invités internationaux. Une soirée garantie 100% rire et bonne humeur.",
      city: "Libreville",
      coverImage: PLACEHOLDER_IMAGES[2],
      startInDays: 10,
      durationHours: 3,
      status: EventStatus.PUBLISHED,
      ticketTypes: [
        { name: "Standard", priceXaf: 7500, quantity: 250 },
        { name: "Premium (place assise)", priceXaf: 15000, quantity: 60 },
      ],
    },
    {
      organizerId: organizer1._id,
      venueId: venuePortGentil._id,
      categorySlug: "business-tech",
      title: "Gabon Tech Summit",
      summary:
        "Conférence sur l'innovation, la tech et l'entrepreneuriat au Gabon.",
      description:
        "Le Gabon Tech Summit réunit entrepreneurs, investisseurs et innovateurs pour deux jours de conférences, ateliers et networking autour de la transformation numérique du Gabon.",
      city: "Port-Gentil",
      coverImage: PLACEHOLDER_IMAGES[3],
      startInDays: 35,
      durationHours: 10,
      status: EventStatus.PUBLISHED,
      ticketTypes: [
        { name: "Pass 1 jour", priceXaf: 20000, quantity: 300 },
        { name: "Pass complet", priceXaf: 35000, quantity: 150 },
      ],
    },
    {
      organizerId: organizer1._id,
      venueId: venueFranceville._id,
      categorySlug: "sport-bien-etre",
      title: "Course des Cascades de Franceville",
      summary:
        "Course populaire de 10km à travers les paysages du Haut-Ogooué.",
      description:
        "Participez à la Course des Cascades, un événement sportif familial de 10km mettant en valeur les magnifiques paysages naturels de Franceville.",
      city: "Franceville",
      coverImage: PLACEHOLDER_IMAGES[4],
      startInDays: 45,
      durationHours: 4,
      status: EventStatus.PUBLISHED,
      ticketTypes: [{ name: "Inscription", priceXaf: 5000, quantity: 500 }],
    },
    {
      organizerId: organizer2._id,
      venueId: venueLibreville._id,
      categorySlug: "mode-beaute",
      title: "Libreville Fashion Week",
      summary:
        "Défilés des plus grands créateurs de mode gabonais et africains.",
      description:
        "La Libreville Fashion Week met en lumière le talent des créateurs de mode gabonais avec des défilés, expositions et rencontres professionnelles.",
      city: "Libreville",
      coverImage: PLACEHOLDER_IMAGES[5],
      startInDays: 60,
      durationHours: 5,
      status: EventStatus.DRAFT,
      ticketTypes: [{ name: "Standard", priceXaf: 15000, quantity: 200 }],
    },
    {
      organizerId: organizer1._id,
      venueId: venueLibreville2._id,
      categorySlug: "musique",
      title: "Concert Acoustique Annulé (test)",
      summary:
        "Cet événement a été annulé pour démontrer le flux d'annulation.",
      description:
        "Cet événement sert à démontrer le comportement d'annulation d'un événement dans Noma Events.",
      city: "Libreville",
      coverImage: PLACEHOLDER_IMAGES[2],
      startInDays: 5,
      durationHours: 2,
      status: EventStatus.CANCELLED,
      ticketTypes: [{ name: "Standard", priceXaf: 5000, quantity: 100 }],
    },
  ]

  let firstPublishedEventId: string | null = null
  let firstPublishedTicketTypeId: string | null = null

  for (const seedEvent of seedEvents) {
    const category = categoryBySlug.get(seedEvent.categorySlug)
    if (!category) continue

    const startAt = daysFromNow(seedEvent.startInDays)
    const endAt = new Date(
      startAt.getTime() + seedEvent.durationHours * 60 * 60 * 1000,
    )
    const slugBase = seedEvent.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const event = await EventModel.create({
      organizerId: seedEvent.organizerId,
      venueId: seedEvent.venueId,
      categoryId: category._id,
      title: seedEvent.title,
      slug: slugBase,
      summary: seedEvent.summary,
      description: seedEvent.description,
      coverImage: seedEvent.coverImage,
      gallery: [],
      city: seedEvent.city,
      startAt,
      endAt,
      salesStartAt: new Date(),
      salesEndAt: startAt,
      status:
        seedEvent.status === EventStatus.DRAFT
          ? EventStatus.DRAFT
          : EventStatus.PUBLISHED,
      visibility: EventVisibility.PUBLIC,
      publishedAt:
        seedEvent.status === EventStatus.DRAFT ? undefined : new Date(),
    })

    const ticketTypes = await TicketTypeModel.insertMany(
      seedEvent.ticketTypes.map((tt) => ({
        eventId: event._id,
        name: tt.name,
        priceXaf: tt.priceXaf,
        quantity: tt.quantity,
        soldQuantity: 0,
        reservedQuantity: 0,
        salesStartAt: new Date(),
        salesEndAt: startAt,
        active: true,
      })),
    )
    await recomputeEventPricing(event._id.toString())

    if (seedEvent.status === EventStatus.CANCELLED) {
      event.status = EventStatus.CANCELLED
      event.cancelledAt = new Date()
      await event.save()
    }

    if (!firstPublishedEventId && seedEvent.status === EventStatus.PUBLISHED) {
      firstPublishedEventId = event._id.toString()
      firstPublishedTicketTypeId = ticketTypes[0]._id.toString()
    }
  }

  // ---- Assign event staff to the first published event ----
  if (firstPublishedEventId) {
    await EventStaffModel.create({
      eventId: firstPublishedEventId,
      userId: staff._id,
      permissions: ["SCAN"],
      active: true,
    })
  }

  // ---- Sample paid order + issued tickets for the demo attendee ----
  if (firstPublishedEventId && firstPublishedTicketTypeId) {
    const ticketType = await TicketTypeModel.findById(
      firstPublishedTicketTypeId,
    )
    if (ticketType) {
      const quantity = 2
      const order = await OrderModel.create({
        orderNumber: "ORD-DEMO0001",
        userId: attendee._id,
        eventId: firstPublishedEventId,
        items: [
          {
            ticketTypeId: ticketType._id,
            ticketTypeName: ticketType.name,
            quantity,
            unitPriceXaf: ticketType.priceXaf,
            totalXaf: ticketType.priceXaf * quantity,
          },
        ],
        attendee: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
        },
        subtotalXaf: ticketType.priceXaf * quantity,
        feesXaf: 0,
        totalXaf: ticketType.priceXaf * quantity,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      })

      await PaymentModel.create({
        orderId: order._id,
        provider: "mock",
        providerReference: "MOCK-DEMO-SEED",
        amountXaf: order.totalXaf,
        status: PaymentStatus.SUCCESS,
        verifiedAt: new Date(),
      })

      await TicketTypeModel.findByIdAndUpdate(ticketType._id, {
        $inc: { reservedQuantity: quantity },
      })
      await issueTicketsForOrder(order)
    }
  }

  logger.info(
    {
      accounts: {
        admin: "admin@noma.events",
        organizer: "organizer@noma.events",
        organizer2: "organizer2@noma.events",
        attendee: "attendee@noma.events",
        staff: "staff@noma.events",
        password: DEV_PASSWORD,
      },
    },
    "Seed complete",
  )
}

/* istanbul ignore next -- CLI entrypoint, exercised manually via `npm run seed` */
if (require.main === module) {
  ;(async () => {
    const { connectDatabase, disconnectDatabase } = await import("./connection")
    await connectDatabase()
    await seedDatabase()
    await disconnectDatabase()
    process.exit(0)
  })()
}
