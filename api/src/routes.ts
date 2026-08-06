import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import pricingRoutes from "./modules/pricing/pricing.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import driversRoutes from "./modules/drivers/drivers.routes";
import vehiclesRoutes from "./modules/vehicles/vehicles.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import supportRoutes from "./modules/support/support.routes";
import ratesRoutes from "./modules/rates/rates.routes";
import supplierRoutes from "./modules/supplier/supplier.routes";
import fareRoutes from "./modules/fare/fare.routes";
import locationRoutes from "./modules/location/location.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pricing", pricingRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/drivers", driversRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/payments", paymentsRoutes);
router.use("/support", supportRoutes);
router.use("/rates", ratesRoutes);
router.use("/supplier", supplierRoutes);
router.use("/fare", fareRoutes);
router.use("/location", locationRoutes);

export default router;
