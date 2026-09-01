export type UsCdPackageActionLine = {
  productId: number;
  quantity: number;
  assemblyModsNote?: string | null;
  addonEachCents: number;
};

export type UsCdPackageActionInput = {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingMethod: string;
  estimateNumber: string;
  warehouse: string;
  deliveryCents: number;
  freightCents: number;
  installationCents: number;
  primaryFinishId: number | null;
  items: UsCdPackageActionLine[];
};

export function hydrateUsCdPackageEditorState<T extends UsCdPackageActionLine>(input: Omit<UsCdPackageActionInput, "items"> & { items: T[] }) {
  return {
    form: {
      customerName: input.customerName,
      customerAddress: input.customerAddress,
      customerPhone: input.customerPhone,
      shippingMethod: input.shippingMethod,
      estimateNumber: input.estimateNumber,
      warehouse: input.warehouse,
    },
    supplierCosts: { deliveryCents: input.deliveryCents, freightCents: input.freightCents, installationCents: input.installationCents },
    primaryFinishId: input.primaryFinishId ?? undefined,
    comparisonFinishIds: input.primaryFinishId ? [input.primaryFinishId] : [],
    items: input.items.map(item => ({ ...item, assemblyModsNote: item.assemblyModsNote ?? null })),
  };
}

export function buildUsCdPackageUpdateInput(input: UsCdPackageActionInput) {
  return {
    ...input,
    primaryFinishId: input.primaryFinishId ?? 0,
    items: input.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      assemblyModsNote: item.assemblyModsNote?.trim() || undefined,
      addonEachCents: item.addonEachCents,
    })),
  };
}

export function buildUsCdDuplicateInput(input: UsCdPackageActionInput) {
  return {
    customerName: input.customerName,
    customerAddress: input.customerAddress,
    customerPhone: input.customerPhone,
    shippingMethod: input.shippingMethod,
    estimateNumber: `${input.estimateNumber}-COPY`,
    warehouse: input.warehouse,
    deliveryCents: input.deliveryCents,
    freightCents: input.freightCents,
    installationCents: input.installationCents,
    primaryFinishId: input.primaryFinishId ?? 0,
    items: input.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      assemblyModsNote: item.assemblyModsNote ?? null,
      addonEachCents: item.addonEachCents,
    })),
  };
}

export async function executeUsCdPackageDeletion(packageId: number, actions: {
  deleteItems: (packageId: number) => Promise<void>;
  deletePackage: (packageId: number) => Promise<boolean>;
}) {
  await actions.deleteItems(packageId);
  const deleted = await actions.deletePackage(packageId);
  if (!deleted) throw new Error("U.S. Cabinet Depot package not found.");
  return { success: true as const, packageId };
}
