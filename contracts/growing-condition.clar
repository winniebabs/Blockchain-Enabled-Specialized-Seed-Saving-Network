;; Growing Condition Contract
;; Tracks optimal climate and soil requirements

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u403))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))

;; Data structures
(define-map growing-conditions
  { condition-id: uint }
  {
    variety-id: uint,
    creator: principal,
    climate-zone: (string-ascii 100),
    temperature-min: int,
    temperature-max: int,
    rainfall-min: uint,
    rainfall-max: uint,
    soil-type: (string-ascii 100),
    soil-ph-min: uint,
    soil-ph-max: uint,
    sunlight-requirements: (string-ascii 100),
    planting-season: (string-ascii 100),
    days-to-maturity: uint,
    companion-plants: (string-ascii 200),
    notes: (string-ascii 500),
    creation-date: uint
  }
)

(define-map variety-to-conditions
  { variety-id: uint }
  { condition-ids: (list 10 uint) }
)

(define-data-var last-condition-id uint u0)

;; Public functions
(define-public (register-growing-condition
                (variety-id uint)
                (climate-zone (string-ascii 100))
                (temperature-min int)
                (temperature-max int)
                (rainfall-min uint)
                (rainfall-max uint)
                (soil-type (string-ascii 100))
                (soil-ph-min uint)
                (soil-ph-max uint)
                (sunlight-requirements (string-ascii 100))
                (planting-season (string-ascii 100))
                (days-to-maturity uint)
                (companion-plants (string-ascii 200))
                (notes (string-ascii 500)))
  (let ((new-id (+ (var-get last-condition-id) u1)))
    (var-set last-condition-id new-id)

    ;; Create the growing condition
    (map-set growing-conditions
      { condition-id: new-id }
      {
        variety-id: variety-id,
        creator: tx-sender,
        climate-zone: climate-zone,
        temperature-min: temperature-min,
        temperature-max: temperature-max,
        rainfall-min: rainfall-min,
        rainfall-max: rainfall-max,
        soil-type: soil-type,
        soil-ph-min: soil-ph-min,
        soil-ph-max: soil-ph-max,
        sunlight-requirements: sunlight-requirements,
        planting-season: planting-season,
        days-to-maturity: days-to-maturity,
        companion-plants: companion-plants,
        notes: notes,
        creation-date: block-height
      }
    )

    ;; Update the variety-to-conditions mapping
    (match (map-get? variety-to-conditions { variety-id: variety-id })
      existing-mapping
        (map-set variety-to-conditions
          { variety-id: variety-id }
          { condition-ids: (unwrap! (as-max-len? (append (get condition-ids existing-mapping) new-id) u10) (err u500)) }
        )
      ;; If no mapping exists yet, create a new one
      (map-set variety-to-conditions
        { variety-id: variety-id }
        { condition-ids: (list new-id) }
      )
    )

    (ok new-id)
  )
)

(define-public (update-growing-condition
                (condition-id uint)
                (climate-zone (string-ascii 100))
                (temperature-min int)
                (temperature-max int)
                (rainfall-min uint)
                (rainfall-max uint)
                (soil-type (string-ascii 100))
                (soil-ph-min uint)
                (soil-ph-max uint)
                (sunlight-requirements (string-ascii 100))
                (planting-season (string-ascii 100))
                (days-to-maturity uint)
                (companion-plants (string-ascii 200))
                (notes (string-ascii 500)))
  (match (map-get? growing-conditions { condition-id: condition-id })
    condition
      (if (is-eq tx-sender (get creator condition))
        (begin
          (map-set growing-conditions
            { condition-id: condition-id }
            (merge condition {
              climate-zone: climate-zone,
              temperature-min: temperature-min,
              temperature-max: temperature-max,
              rainfall-min: rainfall-min,
              rainfall-max: rainfall-max,
              soil-type: soil-type,
              soil-ph-min: soil-ph-min,
              soil-ph-max: soil-ph-max,
              sunlight-requirements: sunlight-requirements,
              planting-season: planting-season,
              days-to-maturity: days-to-maturity,
              companion-plants: companion-plants,
              notes: notes
            })
          )
          (ok condition-id)
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-FOUND
  )
)

;; Read-only functions
(define-read-only (get-growing-condition (condition-id uint))
  (map-get? growing-conditions { condition-id: condition-id })
)

(define-read-only (get-conditions-for-variety (variety-id uint))
  (match (map-get? variety-to-conditions { variety-id: variety-id })
    mapping (ok (get condition-ids mapping))
    (err u404)
  )
)

(define-read-only (is-suitable-climate (condition-id uint) (temperature int) (rainfall uint) (soil-ph uint))
  (match (map-get? growing-conditions { condition-id: condition-id })
    condition
      (ok (and
            (>= temperature (get temperature-min condition))
            (<= temperature (get temperature-max condition))
            (>= rainfall (get rainfall-min condition))
            (<= rainfall (get rainfall-max condition))
            (>= soil-ph (get soil-ph-min condition))
            (<= soil-ph (get soil-ph-max condition))
          ))
    (err u404)
  )
)

(define-read-only (get-last-condition-id)
  (var-get last-condition-id)
)
