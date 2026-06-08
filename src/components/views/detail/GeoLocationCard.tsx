import React from 'react';
import { MapPin, RefreshCw, Edit2, Save, X, AlertCircle, Compass, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { IETFGeoLocation } from '../../../types';
import { NetworkService } from '../../../services/networkService';

interface GeoLocationCardProps {
  title: string;
  geoLocation?: IETFGeoLocation;
  inheritedFrom?: string;
  onSave: (locationObj: IETFGeoLocation) => void;
}

export function GeoLocationCard({ title, geoLocation, inheritedFrom, onSave }: GeoLocationCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  // Reference Frame
  const [astronomicalBody, setAstronomicalBody] = React.useState('earth');
  const [geodeticDatum, setGeodeticDatum] = React.useState('wgs-84');
  const [alternateSystemEnabled, setAlternateSystemEnabled] = React.useState(false);
  const [alternateSystem, setAlternateSystem] = React.useState('');
  const [coordAccuracy, setCoordAccuracy] = React.useState('0.1');
  const [heightAccuracy, setHeightAccuracy] = React.useState('1.0');

  // Location Tab choice
  const [locationMode, setLocationMode] = React.useState<'ellipsoid' | 'cartesian'>('ellipsoid');

  // Ellipsoidal fields
  const [latStr, setLatStr] = React.useState('35.6895');
  const [lngStr, setLngStr] = React.useState('139.6917');
  const [heightStr, setHeightStr] = React.useState('15');

  // Cartesian fields
  const [cartesianX, setCartesianX] = React.useState('0');
  const [cartesianY, setCartesianY] = React.useState('0');
  const [cartesianZ, setCartesianZ] = React.useState('0');

  // Velocity
  const [velocityEnabled, setVelocityEnabled] = React.useState(false);
  const [vNorth, setVNorth] = React.useState('0');
  const [vEast, setVEast] = React.useState('0');
  const [vUp, setVUp] = React.useState('0');

  // Temporal Validity
  const [temporalEnabled, setTemporalEnabled] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState('');
  const [validUntil, setValidUntil] = React.useState('');

  // Error logging
  const [error, setError] = React.useState<string | null>(null);

  // Expiry State Live evaluation
  const [isExpired, setIsExpired] = React.useState(false);

  // Parse ISO date back to datetime-local friendly format YYYY-MM-DDTHH:mm
  const formatIsoToDatetimeLocal = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  React.useEffect(() => {
    if (geoLocation) {
      setAstronomicalBody(geoLocation.referenceFrame.astronomicalBody || 'earth');
      setGeodeticDatum(geoLocation.referenceFrame.geodeticSystem.geodeticDatum || 'wgs-84');
      setAlternateSystemEnabled(!!geoLocation.referenceFrame.alternateSystem);
      setAlternateSystem(geoLocation.referenceFrame.alternateSystem || '');
      setCoordAccuracy(geoLocation.referenceFrame.geodeticSystem.coordAccuracy !== undefined ? geoLocation.referenceFrame.geodeticSystem.coordAccuracy.toString() : '0.1');
      setHeightAccuracy(geoLocation.referenceFrame.geodeticSystem.heightAccuracy !== undefined ? geoLocation.referenceFrame.geodeticSystem.heightAccuracy.toString() : '1.0');

      if (geoLocation.location.ellipsoid) {
        setLocationMode('ellipsoid');
        setLatStr(geoLocation.location.ellipsoid.latitude.toString());
        setLngStr(geoLocation.location.ellipsoid.longitude.toString());
        setHeightStr(geoLocation.location.ellipsoid.height !== undefined ? geoLocation.location.ellipsoid.height.toString() : '0');
        setCartesianX('0');
        setCartesianY('0');
        setCartesianZ('0');
      } else if (geoLocation.location.cartesian) {
        setLocationMode('cartesian');
        setCartesianX(geoLocation.location.cartesian.x.toString());
        setCartesianY(geoLocation.location.cartesian.y.toString());
        setCartesianZ(geoLocation.location.cartesian.z.toString());
        setLatStr('35.6895');
        setLngStr('139.6917');
        setHeightStr('15');
      }

      if (geoLocation.velocity) {
        setVelocityEnabled(true);
        setVNorth(geoLocation.velocity.vNorth.toString());
        setVEast(geoLocation.velocity.vEast.toString());
        setVUp(geoLocation.velocity.vUp.toString());
      } else {
        setVelocityEnabled(false);
        setVNorth('0');
        setVEast('0');
        setVUp('0');
      }

      if (geoLocation.timestamp || geoLocation.validUntil) {
        setTemporalEnabled(true);
        setTimestamp(geoLocation.timestamp ? formatIsoToDatetimeLocal(geoLocation.timestamp) : '');
        setValidUntil(geoLocation.validUntil ? formatIsoToDatetimeLocal(geoLocation.validUntil) : '');
      } else {
        setTemporalEnabled(false);
        setTimestamp('');
        setValidUntil('');
      }
    } else {
      setAstronomicalBody('earth');
      setGeodeticDatum('wgs-84');
      setAlternateSystemEnabled(false);
      setAlternateSystem('');
      setCoordAccuracy('0.1');
      setHeightAccuracy('1.0');
      setLocationMode('ellipsoid');
      setLatStr('35.6895');
      setLngStr('139.6917');
      setHeightStr('15');
      setCartesianX('0');
      setCartesianY('0');
      setCartesianZ('0');
      setVelocityEnabled(false);
      setVNorth('0');
      setVEast('0');
      setVUp('0');
      setTemporalEnabled(false);
      setTimestamp('');
      setValidUntil('');
    }
  }, [geoLocation, isEditing, inheritedFrom]);

  // Live checker for validity expiration
  React.useEffect(() => {
    if (geoLocation && geoLocation.validUntil) {
      const checkExpiry = () => {
        const expiryDate = new Date(geoLocation.validUntil!);
        const now = new Date();
        setIsExpired(now > expiryDate);
      };
      checkExpiry();
      const interval = setInterval(checkExpiry, 5000);
      return () => clearInterval(interval);
    } else {
      setIsExpired(false);
    }
  }, [geoLocation]);

  const handleRenewValidity = () => {
    if (!geoLocation) return;
    const now = new Date();
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const renewed: IETFGeoLocation = {
      ...geoLocation,
      timestamp: now.toISOString(),
      validUntil: future.toISOString()
    };
    onSave(renewed);
  };

  const handleSave = () => {
    let cleanBody = astronomicalBody.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanBody) {
      setError('Astronomical body is required.');
      return;
    }
    const bodyPattern = /^[ -@\[-\^_-~]+$/;
    if (!bodyPattern.test(cleanBody)) {
      setError('Astronomical body contains invalid characters (printable ASCII only).');
      return;
    }

    let cleanDatum = geodeticDatum.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanDatum) {
      cleanDatum = cleanBody === 'earth' ? 'wgs-84' : 'mean-earth-me';
    }
    if (!bodyPattern.test(cleanDatum)) {
      setError('Geodetic datum contains invalid characters (printable ASCII only).');
      return;
    }

    const parsedCoordAcc = coordAccuracy ? parseFloat(coordAccuracy) : undefined;
    if (parsedCoordAcc !== undefined && (isNaN(parsedCoordAcc) || parsedCoordAcc < 0)) {
      setError('Coordinate accuracy must be a non-negative decimal.');
      return;
    }

    const parsedHeightAcc = heightAccuracy ? parseFloat(heightAccuracy) : undefined;
    if (parsedHeightAcc !== undefined && (isNaN(parsedHeightAcc) || parsedHeightAcc < 0)) {
      setError('Height accuracy must be a non-negative decimal.');
      return;
    }

    let locationVal: IETFGeoLocation['location'] = {};

    if (locationMode === 'ellipsoid') {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const height = heightStr ? parseFloat(heightStr) : undefined;

      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude degrees must be within ellipsoidal limits [-90.0, +90.0]');
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('Longitude degrees must be within ellipsoidal limits [-180.0, +180.0]');
        return;
      }
      if (height !== undefined && isNaN(height)) {
        setError('Height must be a valid number (meters)');
        return;
      }

      locationVal = {
        ellipsoid: {
          latitude: Number(lat.toFixed(16)),
          longitude: Number(lng.toFixed(16)),
          height: height !== undefined ? Number(height.toFixed(6)) : undefined
        }
      };
    } else {
      const x = parseFloat(cartesianX);
      const y = parseFloat(cartesianY);
      const z = parseFloat(cartesianZ);

      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        setError('Cartesian representation co-dependency check: X, Y, and Z coordinates are all required together.');
        return;
      }

      locationVal = {
        cartesian: {
          x: Number(x.toFixed(6)),
          y: Number(y.toFixed(6)),
          z: Number(z.toFixed(6))
        }
      };
    }

    let velocityVal: IETFGeoLocation['velocity'] = undefined;
    if (velocityEnabled) {
      const vn = parseFloat(vNorth || '0');
      const ve = parseFloat(vEast || '0');
      const vu = parseFloat(vUp || '0');

      if (isNaN(vn) || isNaN(ve) || isNaN(vu)) {
        setError('Velocity vector components must be valid decimal values (m/s).');
        return;
      }

      velocityVal = {
        vNorth: Number(vn.toFixed(12)),
        vEast: Number(ve.toFixed(12)),
        vUp: Number(vu.toFixed(12))
      };
    }

    let finalTimestamp: string | undefined = undefined;
    let finalValidUntil: string | undefined = undefined;

    if (temporalEnabled) {
      if (!timestamp) {
        setError('Recording reference timestamp is required when temporal validation is enabled.');
        return;
      }
      const t1 = new Date(timestamp);
      if (isNaN(t1.getTime())) {
        setError('Recording timestamp is invalid.');
        return;
      }
      finalTimestamp = t1.toISOString();

      if (validUntil) {
        const t2 = new Date(validUntil);
        if (isNaN(t2.getTime())) {
          setError('Expiration epoch date is invalid.');
          return;
        }
        if (t2.getTime() <= t1.getTime()) {
          setError('Chronological check failed: valid-until timestamp must be strictly after the recorded timestamp.');
          return;
        }
        finalValidUntil = t2.toISOString();
      }
    }

    setError(null);
    onSave({
      referenceFrame: {
        astronomicalBody: cleanBody,
        geodeticSystem: {
          geodeticDatum: cleanDatum,
          coordAccuracy: parsedCoordAcc !== undefined ? Number(parsedCoordAcc.toFixed(6)) : undefined,
          heightAccuracy: parsedHeightAcc !== undefined ? Number(parsedHeightAcc.toFixed(6)) : undefined,
        },
        alternateSystem: alternateSystemEnabled && alternateSystem.trim() ? alternateSystem.trim() : undefined
      },
      location: locationVal,
      velocity: velocityVal,
      timestamp: finalTimestamp,
      validUntil: finalValidUntil
    });
    setIsEditing(false);
  };

  const calcMotionTrajectory = () => {
    if (!geoLocation || !geoLocation.velocity) return null;
    const { vNorth: vn, vEast: ve, vUp: vu } = geoLocation.velocity;
    const horizSpeed = Math.sqrt(vn * vn + ve * ve);
    const speedKmh = horizSpeed * 3.6;
    const headingDegrees = (Math.atan2(ve, vn) * 180 / Math.PI + 360) % 360;

    const compassDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(((headingDegrees % 360) / 22.5)) % 16;
    const cardinalStr = compassDirections[idx];

    return {
      speedMps: horizSpeed.toFixed(4),
      speedKmh: speedKmh.toFixed(2),
      headingDeg: headingDegrees.toFixed(1),
      cardinal: cardinalStr,
      isMoving: horizSpeed > 0.001 || Math.abs(vu) > 0.001
    };
  };

  const trajectory = calcMotionTrajectory();
  const hasPhysicalCoordinates = geoLocation || inheritedFrom;

  return (
    <Card className="bg-background border-border shadow-none text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            {title}
          </CardTitle>
          {inheritedFrom && !geoLocation && (
            <p className="text-[10px] text-amber-500/90 font-mono tracking-wide uppercase flex items-center gap-1">
              <span>💡 Inductive Inheritance Active (Acquiring physical location from parent {inheritedFrom})</span>
            </p>
          )}
          {geoLocation && geoLocation.validUntil && (
            <div className="flex items-center gap-2 mt-1">
              {isExpired ? (
                <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold font-mono">
                  🚨 Expired (Epoch Breached)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold font-mono">
                  🟢 Coordinate Valid & Active
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <div className="flex gap-2">
              {geoLocation && geoLocation.validUntil && isExpired && (
                <button
                  onClick={handleRenewValidity}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-bold transition-all"
                  title="Update timestamp & advance validity range"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Validity
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-bold transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {geoLocation ? 'Edit Configuration' : 'Override/Edit Coordinates'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-[11px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save Coordinate Parameters
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground text-[11px] font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          )}
          <Badge variant="outline" className="bg-purple-500/15 text-purple-450 border-purple-500/20 text-[10px] font-mono">
            RFC 9179 Specs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-500 bg-rose-500/15 border border-rose-500/25 px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <h4 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                1. Geographic Reference Frame (RFC 9179 Sec. 2.1)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Astronomical Body Context
                  </label>
                  <input
                    type="text"
                    value={astronomicalBody}
                    onChange={(e) => setAstronomicalBody(e.target.value)}
                    placeholder="e.g. earth, moon, mars"
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Defaults to "earth". Normalized to lowercase.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Geodetic Datum
                  </label>
                  <input
                    type="text"
                    value={geodeticDatum}
                    onChange={(e) => setGeodeticDatum(e.target.value)}
                    placeholder="e.g. wgs-84, mean-earth-me"
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Earth fallback is "wgs-84". Moon standard is "mean-earth-me".</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Horiz Accuracy (coord-accuracy)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={coordAccuracy}
                    onChange={(e) => setCoordAccuracy(e.target.value)}
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Vert elevation Accuracy (height-accuracy)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={heightAccuracy}
                    onChange={(e) => setHeightAccuracy(e.target.value)}
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="altSystemCheck"
                      checked={alternateSystemEnabled}
                      onChange={(e) => setAlternateSystemEnabled(e.target.checked)}
                      className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5"
                    />
                    <label htmlFor="altSystemCheck" className="text-xs font-semibold text-foreground/90 select-none cursor-pointer">
                      Activate Alternate Reference System (RFC 9179 alternate-system)
                    </label>
                  </div>
                  {alternateSystemEnabled && (
                    <div className="space-y-1.5 transition-all">
                      <input
                        type="text"
                        value={alternateSystem}
                        onChange={(e) => setAlternateSystem(e.target.value)}
                        placeholder="e.g. mars-sim-v1"
                        className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                  2. Location Coordinates Model (RFC 9179 Sec. 2.2 / 2.3)
                </h4>
                <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setLocationMode('ellipsoid')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${locationMode === 'ellipsoid' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Ellipsoidal Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('cartesian')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${locationMode === 'cartesian' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Cartesian Space Choice
                  </button>
                </div>
              </div>

              {locationMode === 'ellipsoid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Latitude (Degrees)
                    </label>
                    <input
                      type="text"
                      value={latStr}
                      onChange={(e) => setLatStr(e.target.value)}
                      placeholder="e.g. 35.6895"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Longitude (Degrees)
                    </label>
                    <input
                      type="text"
                      value={lngStr}
                      onChange={(e) => setLngStr(e.target.value)}
                      placeholder="e.g. 139.6917"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Elevation/Height (meters)
                    </label>
                    <input
                      type="text"
                      value={heightStr}
                      onChange={(e) => setHeightStr(e.target.value)}
                      placeholder="e.g. 12"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates X Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianX}
                      onChange={(e) => setCartesianX(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates Y Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianY}
                      onChange={(e) => setCartesianY(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates Z Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianZ}
                      onChange={(e) => setCartesianZ(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="velocityToggleInput"
                  checked={velocityEnabled}
                  onChange={(e) => setVelocityEnabled(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="velocityToggleInput" className="text-xs font-bold text-foreground/90 select-none cursor-pointer flex items-center gap-2">
                  <span>3. Motion Velocity Vector Trajectory Telemetry (RFC 9179 Sec. 2.4)</span>
                </label>
              </div>

              {velocityEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity toward true north (v-north)
                    </label>
                    <input
                      type="text"
                      value={vNorth}
                      onChange={(e) => setVNorth(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity aligned true east (v-east)
                    </label>
                    <input
                      type="text"
                      value={vEast}
                      onChange={(e) => setVEast(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity away from center (v-up)
                    </label>
                    <input
                      type="text"
                      value={vUp}
                      onChange={(e) => setVUp(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="temporalCheckToggle"
                  checked={temporalEnabled}
                  onChange={(e) => setTemporalEnabled(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="temporalCheckToggle" className="text-xs font-bold text-foreground/90 select-none cursor-pointer">
                  4. Temporal Validity Timeline Limit (RFC 9179 Sec. 2.5)
                </label>
              </div>

              {temporalEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Reference Recording Timestamp (UTC/Local)
                    </label>
                    <input
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Expiration Threshold epoch (valid-until)
                    </label>
                    <input
                      type="datetime-local"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {hasPhysicalCoordinates ? (
              <div className="space-y-6">
                {geoLocation && geoLocation.location.cartesian ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/25 font-mono text-[9px] tracking-widest uppercase">
                        Cartesian Grid offset Choice Activated
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">X Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.x.toFixed(6)}m
                        </p>
                      </div>
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Y Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.y.toFixed(6)}m
                        </p>
                      </div>
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Z Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.z.toFixed(6)}m
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Latitude</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.latitude.toFixed(10)}°` : 'Inherited'}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Longitude</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.longitude.toFixed(10)}°` : 'Inherited'}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl col-span-2 lg:col-span-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Elevation/Height</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.height || 0}m` : 'Inherited'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-border/40">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Coordinate system / Datum</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/80 font-mono text-[11px]">
                        {geoLocation ? geoLocation.referenceFrame.geodeticSystem.geodeticDatum : geodeticDatum}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Target Astronomical Body</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground text-[11px] capitalize">
                        🌍 {geoLocation ? geoLocation.referenceFrame.astronomicalBody : 'earth'}
                      </Badge>
                    </div>

                    {geoLocation?.referenceFrame?.alternateSystem && (
                      <div className="flex justify-between items-center bg-purple-500/5 px-4 py-2.5 rounded-lg border border-purple-500/20">
                        <span className="text-purple-400 font-bold uppercase tracking-wide text-[10px]">Alternate Grid (Simulation)</span>
                        <Badge className="bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                          {geoLocation.referenceFrame.alternateSystem}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Horizontal accuracy margin</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/85 font-mono text-[11px]">
                        ± {geoLocation?.referenceFrame?.geodeticSystem?.coordAccuracy !== undefined ? `${geoLocation.referenceFrame.geodeticSystem.coordAccuracy}m` : '0.1m'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Vertical altitude accuracy</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/85 font-mono text-[11px]">
                        ± {geoLocation?.referenceFrame?.geodeticSystem?.heightAccuracy !== undefined ? `${geoLocation.referenceFrame.geodeticSystem.heightAccuracy}m` : '1.0m'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {geoLocation?.velocity && (
                  <div className="pt-4 border-t border-border/40">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-blue-400">
                          <Compass className="w-4 h-4 animate-spin-slow" />
                          <span>Motion Trajectory Telemetry (RFC 9179 Sec. 2.4)</span>
                        </div>
                        <Badge className={`font-mono text-[9px] uppercase font-bold tracking-widest ${trajectory?.isMoving ? 'bg-blue-500/25 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                          {trajectory?.isMoving ? '● Moving' : '● Idle / Stationary'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Horizontal Speed</p>
                          <p className="text-base font-bold font-mono text-foreground">{trajectory?.speedMps} m/s</p>
                          <p className="text-[10px] text-muted-foreground/80 font-mono">(~ {trajectory?.speedKmh} km/h)</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Compass Heading</p>
                          <p className="text-base font-bold font-mono text-foreground">{trajectory?.headingDeg}°</p>
                          <p className="text-[10px] text-blue-400 font-bold font-mono">Quadrant: {trajectory?.cardinal}</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Velocity North (v-north)</p>
                          <p className="text-sm font-semibold font-mono text-foreground/80">{geoLocation.velocity.vNorth} m/s</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Velocity Up (v-up)</p>
                          <p className="text-sm font-semibold font-mono text-foreground/80">{geoLocation.velocity.vUp} m/s</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {geoLocation && (geoLocation.timestamp || geoLocation.validUntil) && (
                  <div className="pt-4 border-t border-border/40">
                    <div className="bg-muted/10 border border-border/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1.5 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-foreground/90 font-semibold font-sans">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Temporal Validity Details (RFC 9179 Sec. 2.5)</span>
                        </div>
                        {geoLocation.timestamp && (
                          <p className="text-[11px]"><span className="text-muted-foreground/70 justify-between">Recorded Epoch:</span> {new Date(geoLocation.timestamp).toLocaleString()}</p>
                        )}
                        {geoLocation.validUntil && (
                          <p className="text-[11px]"><span className="text-muted-foreground/70 justify-between">Decay Deadline:</span> {new Date(geoLocation.validUntil).toLocaleString()}</p>
                        )}
                      </div>

                      {geoLocation.validUntil && (
                        <div className="shrink-0 flex items-center md:flex-col gap-2 align-middle">
                          {isExpired ? (
                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold text-center">
                              Coordinate Deprecated / Expired
                            </div>
                          ) : (
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold text-center">
                              Registry State Active
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-xl">
                <MapPin className="mx-auto w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No explicit geographical coordinates are currently provisioned for this system.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-lg transition-all"
                >
                  Configure Geographical Location (RFC 9179 Specifications)
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
