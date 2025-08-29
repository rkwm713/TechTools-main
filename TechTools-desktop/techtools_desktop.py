"""
TechTools Desktop Application
=============================

This script provides a minimal desktop version of the TechTools suite
using Python's built‑in tkinter library. It demonstrates how to build
an offline application that replicates some of the functionality of
the TechTools browser extension and website. The interface is kept
simple so you can expand it easily and adapt it to your needs.

Usage:
  python techtools_desktop.py

This will launch a window with a dropdown to choose a tool. Only the
Feet & Inches Calculator, the QuiC Note pad and a basic Sag
Calculator are implemented as examples. You can extend this file
following the same patterns.

Note: This example does not implement synchronization logic. To
implement syncing when network connectivity becomes available, you
could write results to a JSON file on disk and, upon reconnect, post
the data to your server via requests or other HTTP library.
"""

import tkinter as tk
from tkinter import ttk, messagebox


def to_total_inches(ft: int, inch: int) -> int:
    return ft * 12 + inch


def from_total_inches(total: int) -> tuple[int, int]:
    sign = -1 if total < 0 else 1
    abs_val = abs(total)
    ft = (abs_val // 12) * sign
    inch = abs_val % 12
    return ft, inch


class FeetInchesFrame(ttk.Frame):
    """A simple feet/inches calculator frame."""

    def __init__(self, master: tk.Widget, **kwargs):
        super().__init__(master, **kwargs)
        self.history = []
        ttk.Label(self, text="High measurement (ft)").grid(row=0, column=0, sticky="w")
        self.high_ft = ttk.Entry(self)
        self.high_ft.grid(row=0, column=1)
        ttk.Label(self, text="High measurement (in)").grid(row=1, column=0, sticky="w")
        self.high_in = ttk.Entry(self)
        self.high_in.grid(row=1, column=1)
        ttk.Label(self, text="Low measurement (ft)").grid(row=2, column=0, sticky="w")
        self.low_ft = ttk.Entry(self)
        self.low_ft.grid(row=2, column=1)
        ttk.Label(self, text="Low measurement (in)").grid(row=3, column=0, sticky="w")
        self.low_in = ttk.Entry(self)
        self.low_in.grid(row=3, column=1)
        ttk.Label(self, text="Operation").grid(row=4, column=0, sticky="w")
        self.operation = ttk.Combobox(self, values=["Subtract", "Add"], state="readonly")
        self.operation.current(0)
        self.operation.grid(row=4, column=1)
        calc_btn = ttk.Button(self, text="Calculate", command=self.calculate)
        calc_btn.grid(row=5, column=0, columnspan=2, pady=(5, 5))
        self.result_list = tk.Listbox(self, height=5)
        self.result_list.grid(row=6, column=0, columnspan=2, sticky="nsew")
        self.result_list.bind("<Double-Button-1>", self.copy_selected)
        # Configure row/column weights for resizing
        self.rowconfigure(6, weight=1)
        self.columnconfigure(1, weight=1)

    def calculate(self):
        try:
            hf = int(self.high_ft.get() or 0)
            hi = int(self.high_in.get() or 0)
            lf = int(self.low_ft.get() or 0)
            li = int(self.low_in.get() or 0)
        except ValueError:
            messagebox.showerror("Input error", "Please enter valid integers for measurements.")
            return
        high_total = to_total_inches(hf, hi)
        low_total = to_total_inches(lf, li)
        total = high_total - low_total if self.operation.get() == "Subtract" else high_total + low_total
        ft, inch = from_total_inches(total)
        display = f"{ft}’-{inch}” ({total} in)"
        self.history.append(display)
        if len(self.history) > 4:
            self.history.pop(0)
        self.refresh_list()

    def refresh_list(self):
        self.result_list.delete(0, tk.END)
        for item in self.history:
            self.result_list.insert(tk.END, item)

    def copy_selected(self, event=None):
        selected = self.result_list.curselection()
        if selected:
            value = self.result_list.get(selected[0]).split(" (")[0]
            self.clipboard_clear()
            self.clipboard_append(value)
            messagebox.showinfo("Copied", f"{value} copied to clipboard.")


class NotePadFrame(ttk.Frame):
    """A very simple note pad."""

    def __init__(self, master: tk.Widget, **kwargs):
        super().__init__(master, **kwargs)
        self.text = tk.Text(self, wrap="word", font=("Arial", 11))
        self.text.pack(expand=True, fill="both")
        button_frame = ttk.Frame(self)
        button_frame.pack(fill="x", pady=(5, 0))
        copy_btn = ttk.Button(button_frame, text="Copy", command=self.copy_note)
        copy_btn.pack(side="right")

    def copy_note(self):
        content = self.text.get("1.0", tk.END).strip()
        self.clipboard_clear()
        self.clipboard_append(content)
        messagebox.showinfo("Copied", "Note content copied to clipboard.")


class SagCalculatorFrame(ttk.Frame):
    """A simplified sag calculator."""

    def __init__(self, master: tk.Widget, **kwargs):
        super().__init__(master, **kwargs)
        labels = [
            "Neutral 1 ft", "Neutral 1 in",
            "Neutral 2 ft", "Neutral 2 in",
            "Neutral Midspan ft", "Neutral Midspan in",
            "Fiber 1 ft", "Fiber 1 in",
            "Fiber 2 ft", "Fiber 2 in"
        ]
        self.entries = []
        for idx, label in enumerate(labels):
            ttk.Label(self, text=label).grid(row=idx, column=0, sticky="w")
            entry = ttk.Entry(self)
            entry.grid(row=idx, column=1)
            self.entries.append(entry)
        calc_btn = ttk.Button(self, text="Calculate", command=self.calculate)
        calc_btn.grid(row=len(labels), column=0, columnspan=2, pady=(5, 5))
        self.result_var = tk.StringVar()
        ttk.Label(self, textvariable=self.result_var).grid(row=len(labels) + 1, column=0, columnspan=2, sticky="w")
        # Configure column weight for resizing
        self.columnconfigure(1, weight=1)

    def calculate(self):
        try:
            values = [int(e.get() or 0) for e in self.entries]
        except ValueError:
            messagebox.showerror("Input error", "Please enter valid integers.")
            return
        n1_dec = to_total_inches(values[0], values[1]) / 12
        n2_dec = to_total_inches(values[2], values[3]) / 12
        nmid_dec = to_total_inches(values[4], values[5]) / 12
        f1_dec = to_total_inches(values[6], values[7]) / 12
        f2_dec = to_total_inches(values[8], values[9]) / 12
        if nmid_dec == 0:
            self.result_var.set("Please enter a valid neutral midspan.")
            return
        neutral_avg = (n1_dec + n2_dec) / 2
        sag_factor = neutral_avg / nmid_dec
        fiber_avg = (f1_dec + f2_dec) / 2
        fiber_sag_dec = fiber_avg / sag_factor
        sag_ft = int(fiber_sag_dec)
        sag_in = (fiber_sag_dec - sag_ft) * 12
        sag_in_rounded = round(sag_in)
        final_ft = sag_ft
        final_in = sag_in_rounded
        if sag_in_rounded == 12:
            final_ft += 1
            final_in = 0
        self.result_var.set(f"Sag Factor: {sag_factor:.3f}  |  Fiber Midpoint: {final_ft}’-{final_in}”")


class TechToolsApp(tk.Tk):
    """Main application window."""

    def __init__(self):
        super().__init__()
        self.title("TechTools Desktop")
        self.geometry("480x600")
        # Dropdown to select tool
        self.tools = {
            "Feet & Inches Calculator": FeetInchesFrame,
            "QuiC Note": NotePadFrame,
            "Sag Calculator": SagCalculatorFrame,
        }
        self.tool_var = tk.StringVar(value=list(self.tools.keys())[0])
        ttk.Label(self, text="Select a tool:").pack(pady=(10, 0))
        tool_menu = ttk.OptionMenu(self, self.tool_var, self.tool_var.get(), *self.tools.keys(), command=self.switch_tool)
        tool_menu.pack(fill="x", padx=10)
        self.container = ttk.Frame(self)
        self.container.pack(expand=True, fill="both", padx=10, pady=10)
        self.current_frame: ttk.Frame | None = None
        self.switch_tool(self.tool_var.get())

    def switch_tool(self, tool_name: str):
        if self.current_frame is not None:
            self.current_frame.destroy()
        frame_class = self.tools.get(tool_name)
        if frame_class:
            self.current_frame = frame_class(self.container)
            self.current_frame.pack(expand=True, fill="both")


if __name__ == "__main__":
    app = TechToolsApp()
    app.mainloop()