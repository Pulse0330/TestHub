// ─── Types ────────────────────────────────────────────────────────────────────
export type {
	AimagItem,
	ClassItem,
	DistrictItem,
	SchoolItem,
} from "@/types/location";

export interface SelectedSchool {
	name: string;
	db: string;
	serverip: string;
}

export interface UserData {
	lastname: string;
	firstname: string;
	email: string;
	Phone: string | null;
	img_url: string | null;
	username: string;
	ugroup: number;
	password: string | null;
	aimag_name?: string | null;
	aimag_id?: string | number | null;
	sym_name?: string | null;
	sym_id?: string | number | null;
	sch_name?: string | null;
	schooldb?: string | null;
	studentgroupname?: string | null;
	studentgroupid?: string | null;
}

export interface EditFormState {
	lastname: string;
	firstname: string;
	email: string;
	Phone: string;
	password: string;
	confirmPassword: string;
}
