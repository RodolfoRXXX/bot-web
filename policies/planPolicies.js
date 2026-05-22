const PLAN_POLICIES = {
  starter: {
    features: {
      info_bot: true,
      lead_capture: false,
      appointments: false,
      commerce_assistant: false
    },
    permissions: {
      canReadPublicInfo: true,
      canCaptureLead: false,
      canCreateAppointment: false,
      canReadAppointments: false,
      canShowOffers: false,
      canGuidePurchase: false
    }
  },
  pro: {
    features: {
      info_bot: true,
      lead_capture: true,
      appointments: true,
      commerce_assistant: false
    },
    permissions: {
      canReadPublicInfo: true,
      canCaptureLead: true,
      canCreateAppointment: true,
      canReadAppointments: true,
      canShowOffers: false,
      canGuidePurchase: false
    }
  },
  premium: {
    features: {
      info_bot: true,
      lead_capture: true,
      appointments: true,
      commerce_assistant: true
    },
    permissions: {
      canReadPublicInfo: true,
      canCaptureLead: true,
      canCreateAppointment: true,
      canReadAppointments: true,
      canShowOffers: true,
      canGuidePurchase: true
    }
  }
};

const ACTION_POLICY_MAP = {
  captureLead: { featureKey: "lead_capture", permissionKey: "canCaptureLead" },
  createAppointment: { featureKey: "appointments", permissionKey: "canCreateAppointment" },
  getAppointmentsByCustomer: { featureKey: "appointments", permissionKey: "canReadAppointments" },
  listOffers: { featureKey: "commerce_assistant", permissionKey: "canShowOffers" },
  guidePurchase: { featureKey: "commerce_assistant", permissionKey: "canGuidePurchase" }
};

module.exports = {
  PLAN_POLICIES,
  ACTION_POLICY_MAP
};
