import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddPlayerFormProps {
  onAdd?: (summonerName: string, region: string) => void;
  isLoading?: boolean;
}

export default function AddPlayerForm({ onAdd, isLoading = false }: AddPlayerFormProps) {
  const [summonerName, setSummonerName] = useState("");
  const [region, setRegion] = useState("na1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summonerName.trim()) {
      onAdd?.(summonerName.trim(), region);
      setSummonerName("");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add Player to Track</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Enter Summoner Name..."
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
          className="flex-1"
          data-testid="input-summoner-name"
        />
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-full sm:w-32" data-testid="select-region">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="na1">NA</SelectItem>
            <SelectItem value="euw1">EUW</SelectItem>
            <SelectItem value="eun1">EUNE</SelectItem>
            <SelectItem value="kr">KR</SelectItem>
            <SelectItem value="br1">BR</SelectItem>
            <SelectItem value="la1">LAN</SelectItem>
            <SelectItem value="la2">LAS</SelectItem>
            <SelectItem value="oc1">OCE</SelectItem>
            <SelectItem value="ru">RU</SelectItem>
            <SelectItem value="tr1">TR</SelectItem>
            <SelectItem value="jp1">JP</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={!summonerName.trim() || isLoading}
          className="gap-2"
          data-testid="button-add-player"
        >
          <UserPlus className="h-4 w-4" />
          Add Player
        </Button>
      </form>
    </Card>
  );
}
