import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface Specification {
  label: string;
  value: string;
}

interface SpecificationsTableProps {
  specifications: Specification[];
}

export function SpecificationsTable({ specifications }: SpecificationsTableProps) {
  return (
    <Table>
      <TableBody>
        {specifications.map((spec, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium text-muted-foreground w-1/3">
              {spec.label}
            </TableCell>
            <TableCell>{spec.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
