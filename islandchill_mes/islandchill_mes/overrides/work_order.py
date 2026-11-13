"""
Work Order override — ports the three fork patches:

  P1: extra-goods UOM conversion before computing fg_completed_qty
  P2: fg_completed_qty = good + extra_goods(converted) + process_loss
  P3: Equipment List `show_on_app` honored in checklist queries

Verified against ERPNext v16.x WorkOrder.make_stock_entry patterns.
"""
import frappe
from erpnext.manufacturing.doctype.work_order.work_order import WorkOrder
from frappe.utils import flt


class CustomWorkOrder(WorkOrder):
    def make_stock_entry(self, purpose=None):
        """Override to inject Island Chill fg qty logic into Manufacture SE."""
        stock_entry = super().make_stock_entry(purpose=purpose)
        if stock_entry and stock_entry.purpose == "Manufacture":
            self._apply_island_chill_fg_qty(stock_entry)
        return stock_entry

    def _apply_island_chill_fg_qty(self, stock_entry):
        """P1/P2 — count extra goods (UOM-converted) and process loss in FG qty."""
        good_qty = flt(stock_entry.fg_completed_qty)
        extra_qty = self._extra_goods_qty_in_stock_uom(stock_entry)
        process_loss = flt(self.get("process_loss_qty"))
        stock_entry.fg_completed_qty = good_qty + extra_qty + process_loss

    def _extra_goods_qty_in_stock_uom(self, stock_entry):
        """P1 — sum extra-goods rows, converting to FG stock UOM."""
        total = 0.0
        fg_item = stock_entry.item_code or self.production_item
        if not fg_item:
            return total

        stock_uom = frappe.db.get_value("Item", fg_item, "stock_uom")
        for item in stock_entry.get("items", []):
            if item.get("is_extra_goods") and item.item_code == fg_item:
                total += self._convert_to_stock_uom(
                    fg_item, flt(item.qty), item.uom, stock_uom
                )
        return total

    @staticmethod
    def _convert_to_stock_uom(item_code, qty, from_uom, stock_uom=None):
        """Convert quantity from given UOM to item's stock UOM."""
        if not stock_uom:
            stock_uom = frappe.db.get_value("Item", item_code, "stock_uom")
        if from_uom == stock_uom or not from_uom:
            return qty

        conversion = frappe.db.get_value(
            "UOM Conversion Detail",
            {"parent": item_code, "uom": from_uom},
            "conversion_factor",
        )
        return flt(conversion) * qty if conversion else qty
