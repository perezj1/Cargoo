export interface Traveler {
  id: string;
  name: string;
  avatar: string;
  origin: string;
  destination: string;
  date: string;
  capacity: string;
  rating: number;
  trips: number;
  isPublic: boolean;
}

export const MOCK_TRAVELERS: Traveler[] = [
  {
    id: "1",
    name: "Maria Garcia",
    avatar: "",
    origin: "Madrid, Espana",
    destination: "Barcelona, Espana",
    date: "2026-04-15",
    capacity: "10 kg",
    rating: 4.8,
    trips: 23,
    isPublic: true,
  },
  {
    id: "2",
    name: "Carlos Lopez",
    avatar: "",
    origin: "Barcelona, Espana",
    destination: "Valencia, Espana",
    date: "2026-04-20",
    capacity: "5 kg",
    rating: 4.9,
    trips: 45,
    isPublic: true,
  },
  {
    id: "3",
    name: "Ana Martinez",
    avatar: "",
    origin: "Paris, Francia",
    destination: "Lyon, Francia",
    date: "2026-05-01",
    capacity: "8 kg",
    rating: 4.7,
    trips: 12,
    isPublic: true,
  },
  {
    id: "4",
    name: "Pedro Sanchez",
    avatar: "",
    origin: "Lisboa, Portugal",
    destination: "Porto, Portugal",
    date: "2026-04-25",
    capacity: "15 kg",
    rating: 4.6,
    trips: 8,
    isPublic: true,
  },
  {
    id: "5",
    name: "Laura Diaz",
    avatar: "",
    origin: "Roma, Italia",
    destination: "Milan, Italia",
    date: "2026-05-10",
    capacity: "7 kg",
    rating: 5,
    trips: 31,
    isPublic: true,
  },
  {
    id: "6",
    name: "Roberto Fernandez",
    avatar: "",
    origin: "Bilbao, Espana",
    destination: "San Sebastian, Espana",
    date: "2026-04-28",
    capacity: "12 kg",
    rating: 4.5,
    trips: 19,
    isPublic: true,
  },
];
