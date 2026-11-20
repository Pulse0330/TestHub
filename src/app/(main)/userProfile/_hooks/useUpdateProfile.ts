import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserUpdateProfile } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

/** Профайл шинэчлэх mutation. Амжилттай бол profile query-г invalidate хийнэ. */
export function useUpdateProfile(userId: number, onSuccess: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			firstname: string;
			lastname: string;
			phone: string;
			email: string;
			aimag_id: number;
			aimagname: string;
			sym_id: number;
			symname: string;
			regnumber: string;
			password?: string;
			schoolname: string;
			schooldb: string;
			studentgroupid: string;
			studentgroupname: string;
			user_id: number;
			img_url: string;
		}) => {
			return getUserUpdateProfile(
				data.firstname,
				data.lastname,
				data.phone,
				data.email,
				data.aimag_id,
				data.aimagname,
				data.sym_id,
				data.symname,
				data.regnumber,
				data.password ?? "",
				data.schoolname,
				data.schooldb,
				data.studentgroupid,
				data.studentgroupname,
				data.user_id,
				data.img_url ?? "",
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.profile.page(userId),
			});
			onSuccess();
		},
	});
}
