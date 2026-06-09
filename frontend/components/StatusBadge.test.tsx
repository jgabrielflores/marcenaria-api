import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the Portuguese label for a status", () => {
    render(<StatusBadge status="EM_PRODUCAO" />);
    expect(screen.getByText("Em produção")).toBeInTheDocument();
  });

  it("renders the cancelled label", () => {
    render(<StatusBadge status="CANCELADO" />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });
});
