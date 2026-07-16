import { z } from "zod";

export const getMembersQuerySchema = z.object({
  search: z.string().optional(),
  assignment_type: z.enum(["POSKO", "INVENTORY", "UNASSIGNED"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});

export const patchMemberSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  assignmentType: z.enum(["POSKO", "INVENTORY", "UNASSIGNED"]).optional(),
  poskoId: z.string().uuid("ID Posko tidak valid").optional(),
  inventoryLocationId: z.string().uuid("ID Gudang tidak valid").optional(),
}).refine(
  (data) => {
    if (data.assignmentType === "POSKO" && !data.poskoId) {
      return false;
    }
    if (data.assignmentType === "INVENTORY" && !data.inventoryLocationId) {
      return false;
    }
    return true;
  },
  {
    message: "ID lokasi harus ditentukan sesuai dengan tipe penugasan",
    path: ["poskoId", "inventoryLocationId"],
  }
);

export type GetMembersQueryValues = z.infer<typeof getMembersQuerySchema>;
export type PatchMemberValues = z.infer<typeof patchMemberSchema>;
