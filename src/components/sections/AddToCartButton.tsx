"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

export function AddToCartButton({
  product,
  labels,
}: {
  product: Product;
  labels: { add: string; added: string };
}) {
  const cart = useCart();
  const justAdded = cart.justAddedId === product.id;

  return (
    <Button
      variant="primary"
      size="sm"
      className={justAdded ? "!bg-success" : ""}
      onClick={() => cart.add(product)}
      data-cta="add-to-cart"
      data-location={product.id}
    >
      {justAdded ? `✓ ${labels.added}` : labels.add}
    </Button>
  );
}
