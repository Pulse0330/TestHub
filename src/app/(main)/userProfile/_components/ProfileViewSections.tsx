import { Mail, MapPin, Phone, School, User2 } from "lucide-react";
import type { UserData } from "../_lib/types";
import { InfoTile, SectionTitle } from "./ui";

/** Харах горим: хувийн болон байршлын мэдээлэл. */
export function ProfileViewSections({
	user,
	isTeacher,
}: {
	user: UserData;
	isTeacher: boolean;
}) {
	return (
		<div className="space-y-6">
			<div className="card-pop p-5 sm:p-6">
				<SectionTitle
					tone="violet"
					icon={<User2 strokeWidth={2.5} />}
					title="Хувийн мэдээлэл"
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<InfoTile
						tone="violet"
						icon={<User2 strokeWidth={2.5} />}
						label="Овог"
					>
						{user.lastname}
					</InfoTile>
					<InfoTile tone="pink" icon={<User2 strokeWidth={2.5} />} label="Нэр">
						{user.firstname}
					</InfoTile>
					<InfoTile tone="mint" icon={<Mail strokeWidth={2.5} />} label="Имэйл">
						<span className="break-all">{user.email}</span>
					</InfoTile>
					{user.Phone && (
						<InfoTile
							tone="sky"
							icon={<Phone strokeWidth={2.5} />}
							label="Утас"
						>
							{user.Phone}
						</InfoTile>
					)}
				</div>
			</div>

			<div className="card-pop p-5 sm:p-6">
				<SectionTitle
					tone="mint"
					icon={<MapPin strokeWidth={2.5} />}
					title="Байршил мэдээлэл"
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<InfoTile
						tone="mint"
						icon={<MapPin strokeWidth={2.5} />}
						label="Аймаг/Нийслэл"
					>
						{user.aimag_name || (
							<span className="font-semibold text-muted-foreground">—</span>
						)}
					</InfoTile>
					<InfoTile
						tone="sky"
						icon={<MapPin strokeWidth={2.5} />}
						label="Сум/Дүүрэг"
					>
						{user.sym_name || (
							<span className="font-semibold text-muted-foreground">—</span>
						)}
					</InfoTile>
					<InfoTile
						tone="violet"
						icon={<School strokeWidth={2.5} />}
						label="Сургууль"
					>
						{user.sch_name || (
							<span className="font-semibold text-muted-foreground">—</span>
						)}
					</InfoTile>
					{!isTeacher && (
						<InfoTile
							tone="sun"
							icon={<School strokeWidth={2.5} />}
							label="Анги"
						>
							{user.studentgroupname || (
								<span className="font-semibold text-muted-foreground">—</span>
							)}
						</InfoTile>
					)}
				</div>
			</div>
		</div>
	);
}
