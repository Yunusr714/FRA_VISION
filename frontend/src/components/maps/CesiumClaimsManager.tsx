import {
  Viewer,
  Entity,
  Color,
  Cartesian3,
  HeightReference,
  VerticalOrigin,
  HorizontalOrigin,
  NearFarScalar,
  Cartesian2,
  ConstantProperty,
} from "cesium";

export interface Claim {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: "approved" | "pending" | "under-verification" | "rejected" | "fraud";
  claimant: string;
  area: number;
  submittedDate: string;
}

export class CesiumClaimsManager {
  private viewer: Viewer;
  private claimsEntities: Map<string, Entity> = new Map();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  private getStatusColor(status: string): Color {
    switch (status) {
      case "approved":
        return Color.GREEN;
      case "pending":
        return Color.ORANGE;
      case "rejected":
        return Color.RED;
      case "under-verification":
        return Color.BLUE;
      case "fraud":
        return Color.PURPLE;
      default:
        return Color.GRAY;
    }
  }

  addClaim(claim: Claim): Entity {
    const entity = this.viewer.entities.add({
      id: claim.id,
      position: Cartesian3.fromDegrees(
        claim.coordinates[0],
        claim.coordinates[1],
        100
      ),
      point: {
        pixelSize: 15,
        color: this.getStatusColor(claim.status),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        scaleByDistance: new NearFarScalar(1000, 1.5, 100000, 0.5),
      },
      label: {
        text: claim.id,
        font: "12pt sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: 1, // FILL_AND_OUTLINE
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -30),
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        scaleByDistance: new NearFarScalar(1000, 1.0, 100000, 0.3),
      },
      description: `
        <div style="padding: 10px;">
          <h3><strong>${claim.id}</strong></h3>
          <p><strong>Claimant:</strong> ${claim.claimant}</p>
          <p><strong>Area:</strong> ${claim.area} hectares</p>
          <p><strong>Status:</strong> <span style="text-transform: capitalize;">${claim.status.replace(
            "-",
            " "
          )}</span></p>
          <p><strong>Submitted:</strong> ${new Date(
            claim.submittedDate
          ).toLocaleDateString()}</p>
        </div>
      `,
    });

    this.claimsEntities.set(claim.id, entity);
    return entity;
  }

  addClaims(claims: Claim[]): void {
    claims.forEach((claim) => this.addClaim(claim));
  }

  removeClaim(claimId: string): void {
    const entity = this.claimsEntities.get(claimId);
    if (entity) {
      this.viewer.entities.remove(entity);
      this.claimsEntities.delete(claimId);
    }
  }

  updateClaimStatus(claimId: string, newStatus: Claim["status"]): void {
    const entity = this.claimsEntities.get(claimId);
    if (entity && entity.point) {
      entity.point.color = new ConstantProperty(this.getStatusColor(newStatus));
    }
  }

  toggleClaimsVisibility(visible: boolean): void {
    this.claimsEntities.forEach((entity) => {
      if (entity.point) entity.point.show = new ConstantProperty(visible);
      if (entity.label) entity.label.show = new ConstantProperty(visible);
    });
  }

  setClaimsOpacity(opacity: number): void {
    this.claimsEntities.forEach((entity) => {
      if (entity.point) {
        const currentColor = entity.point.color?.getValue(
          this.viewer.clock.currentTime
        );
        if (currentColor) {
          const newColor = currentColor.clone();
          newColor.alpha = opacity;
          entity.point.color = newColor;
        }
      }
    });
  }

  flyToClaim(claimId: string): void {
    const entity = this.claimsEntities.get(claimId);
    if (entity && entity.position) {
      this.viewer.flyTo(entity, {
        duration: 2.0,
        offset: {
          heading: 0,
          pitch: -45,
          range: 5000,
        },
      });
    }
  }

  clearAllClaims(): void {
    this.claimsEntities.forEach((entity) => {
      this.viewer.entities.remove(entity);
    });
    this.claimsEntities.clear();
  }

  // Expose read-only access to internal claim entity map
  getEntity(claimId: string): Entity | undefined {
    return this.claimsEntities.get(claimId);
  }

  forEachEntity(cb: (claimId: string, entity: Entity) => void): void {
    this.claimsEntities.forEach((entity, id) => cb(id, entity));
  }
}

export default CesiumClaimsManager;
