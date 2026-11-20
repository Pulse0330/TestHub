import { Mail, Phone, User2 } from "lucide-react";
import type { UserData } from "../_lib/types";
import { InfoTile } from "./ui";

/** Зүүн баганын товч мэдээлэл. */
export function ProfileSidebar({ user }: { user: UserData }) {
	return (
		<div className="lg:col-span-1">
			<div className="card-pop space-y-3 p-5 sm:p-6">
				<InfoTile tone="violet" icon={<User2 strokeWidth={2.5} />} label="Нэр">
					{user.lastname} {user.firstname}
				</InfoTile>
				<InfoTile tone="mint" icon={<Mail strokeWidth={2.5} />} label="Имэйл">
					<span className="break-all">{user.email}</span>
				</InfoTile>
				{user.Phone && (
					<InfoTile tone="sky" icon={<Phone strokeWidth={2.5} />} label="Утас">
						{user.Phone}
					</InfoTile>
				)}
			</div>
		</div>
	);
}
