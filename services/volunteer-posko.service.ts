export const volunteerPoskoService = {
  getPoskoData: async () => {
    const res = await fetch("/api/relawan/posko");
    return res.json();
  },
  updatePoskoData: async (data: { demografi?: any; kebutuhan?: any[] }) => {
    const res = await fetch("/api/relawan/posko", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }
};
