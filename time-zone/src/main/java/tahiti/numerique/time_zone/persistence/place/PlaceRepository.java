package tahiti.numerique.time_zone.persistence.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    List<Place> findAllByIdNot(Long id);

    /**
     * Change l'implémentation d'un lieu en conservant son id et son audit. JPA ne permet pas de changer
     * la classe d'une entité : on modifie le discriminant en SQL et on vide les colonnes propres aux types.
     * Le contexte de persistance est vidé : relire le lieu après l'appel.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "update " + Place.TABLE
            + " set " + Place.TYPE_COLUMN + " = :type, "
            + ZoneOffsetFixedPlace.ZONE_OFFSET_COLUMN + " = null, "
            + ZoneIdPlace.ZONE_ID_COLUMN + " = null"
            + " where id = :id", nativeQuery = true)
    void changeType(@Param("id") Long id, @Param("type") String type);
}
