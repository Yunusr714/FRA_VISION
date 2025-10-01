import { useEffect, useState } from "react";
import { NGOClaimPartiesApi } from "@/lib/parties-api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, Plus, Pencil } from "lucide-react";

type Props = { claimId: number };

export default function ClaimPartiesManager({ claimId }: Props) {
  const { token } = useAuthStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // New party form
  const [newP, setNewP] = useState<any>({ name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" });

  // Inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editP, setEditP] = useState<any>({});

  async function load() {
    if (!token) return;
    setLoading(true);
    setErr("");
    try {
      const rows = await NGOClaimPartiesApi.list(token, claimId);
      setList(rows);
    } catch (e: any) {
      setErr(e?.message || "Failed to load parties");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token, claimId]);

  async function addParty() {
    if (!token) return;
    if (!newP.name?.trim()) { alert("Name is required"); return; }
    const payload = {
      ...newP,
      age: newP.age ? Number(newP.age) : null,
      gender: newP.gender || null
    };
    await NGOClaimPartiesApi.add(token, claimId, payload);
    setNewP({ name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" });
    await load();
  }

  async function saveEdit() {
    if (!token || !editId) return;
    const payload = {
      ...editP,
      age: editP.age === "" ? null : Number(editP.age) // keep null if blank
    };
    await NGOClaimPartiesApi.update(token, claimId, editId, payload);
    setEditId(null);
    setEditP({});
    await load();
  }

  async function remove(pId: number) {
    if (!token) return;
    if (!confirm("Remove this party?")) return;
    await NGOClaimPartiesApi.remove(token, claimId, pId);
    await load();
  }

  return (
    <div className="space-y-3">
      <div className="font-medium">Manage Parties</div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {/* List with inline edit */}
      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.id} className="grid gap-2 md:grid-cols-6 border rounded p-2 text-sm">
            {editId === p.id ? (
              <>
                <div className="md:col-span-2">
                  <Label>Name</Label>
                  <Input value={editP.name ?? p.name} onChange={(e) => setEditP((s: any) => ({ ...s, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={(editP.gender ?? p.gender) || ""} onValueChange={(v) => setEditP((s: any) => ({ ...s, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="">-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tribe</Label>
                  <Input value={editP.tribe ?? p.tribe ?? ""} onChange={(e) => setEditP((s: any) => ({ ...s, tribe: e.target.value }))} />
                </div>
                <div>
                  <Label>ID Type</Label>
                  <Input value={editP.id_type ?? p.id_type ?? ""} onChange={(e) => setEditP((s: any) => ({ ...s, id_type: e.target.value }))} />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input value={editP.id_number ?? p.id_number ?? ""} onChange={(e) => setEditP((s: any) => ({ ...s, id_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Relation</Label>
                  <Input value={editP.relation ?? p.relation ?? ""} onChange={(e) => setEditP((s: any) => ({ ...s, relation: e.target.value }))} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={editP.age ?? (p.age ?? "")} onChange={(e) => setEditP((s: any) => ({ ...s, age: e.target.value }))} />
                </div>
                <div className="md:col-span-6 flex gap-2 justify-end">
                  <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setEditP({}); }}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2"><span className="font-medium">Name:</span> {p.name}</div>
                <div><span className="font-medium">Gender:</span> {p.gender || "-"}</div>
                <div><span className="font-medium">Tribe:</span> {p.tribe || "-"}</div>
                <div><span className="font-medium">ID:</span> {p.id_type || "-"} {p.id_number || ""}</div>
                <div><span className="font-medium">Relation:</span> {p.relation || "-"}</div>
                <div><span className="font-medium">Age:</span> {p.age ?? "-"}</div>
                <div className="md:col-span-6 flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setEditId(p.id); setEditP({}); }}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
                </div>
              </>
            )}
          </div>
        ))}
        {!list.length && <div className="text-sm text-muted-foreground">No parties added yet.</div>}
      </div>

      {/* Add new party */}
      <div className="border rounded p-3 space-y-2">
        <div className="font-medium">Add Party</div>
        <div className="grid gap-2 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={newP.name} onChange={(e) => setNewP((s: any) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={newP.gender} onValueChange={(v) => setNewP((s: any) => ({ ...s, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="">-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tribe</Label>
            <Input value={newP.tribe} onChange={(e) => setNewP((s: any) => ({ ...s, tribe: e.target.value }))} />
          </div>
          <div>
            <Label>ID Type</Label>
            <Input value={newP.id_type} onChange={(e) => setNewP((s: any) => ({ ...s, id_type: e.target.value }))} placeholder="Aadhaar / VoterID" />
          </div>
          <div>
            <Label>ID Number</Label>
            <Input value={newP.id_number} onChange={(e) => setNewP((s: any) => ({ ...s, id_number: e.target.value }))} />
          </div>
          <div>
            <Label>Relation</Label>
            <Input value={newP.relation} onChange={(e) => setNewP((s: any) => ({ ...s, relation: e.target.value }))} placeholder="Head / Member" />
          </div>
          <div>
            <Label>Age</Label>
            <Input type="number" value={newP.age} onChange={(e) => setNewP((s: any) => ({ ...s, age: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={addParty}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
      </div>
    </div>
  );
}