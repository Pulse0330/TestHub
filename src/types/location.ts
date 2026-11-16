// Аймаг → дүүрэг → сургууль → анги сонголтын төрлүүд (/api/sign/*)

export interface AimagItem {
	mAcode: string;
	mName: string;
	mID: number;
	sort: number;
	miid: string;
	mid1: number;
}

export interface DistrictItem {
	id: number;
	name: string;
	sort: number;
}

export interface SchoolItem {
	sName: string;
	conn: string;
	dbname: string;
	sort: number;
	district_id: number;
	serverip: string;
}

export interface ClassItem {
	id: number;
	class_name: string;
	studentgroupid: string;
	sort: number;
}
